from dotenv import load_dotenv
load_dotenv()

from flask import (
    Flask, render_template, request, redirect, url_for,
    jsonify, flash, send_file, Response
)
from flask_sqlalchemy import SQLAlchemy
import joblib, pandas as pd, os
from io import BytesIO



app = Flask(__name__)

# Use DATABASE_URL env var if set, otherwise SQLite
db_url = os.environ.get('DATABASE_URL')
if db_url:
    SQLALCHEMY_DATABASE_URI = db_url  # e.g. postgres://...?
else:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///paypredict.db'

app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key')

# if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI']:
#     app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
#         'connect_args': {'sslmode': 'require'}
#     }


db = SQLAlchemy(app)

# Load ML artifacts
model   = joblib.load('model/salary_predictor_gb.pkl')
encoder = joblib.load('model/target_encoder.pkl')

# Feature order for prediction
FEATURES = ['Age', 'Gender', 'Education Level', 'Job Title', 'Years of Experience']

# --- Database Model ---
class Employee(db.Model):
    id               = db.Column(db.Integer, primary_key=True)
    name             = db.Column(db.String(100))
    age              = db.Column(db.Integer)
    gender           = db.Column(db.String(20))
    education_level  = db.Column(db.String(50))
    job_title        = db.Column(db.String(100))
    experience       = db.Column(db.Float)
    actual_salary    = db.Column(db.Float)
    predicted_salary = db.Column(db.Float)

# --- Prediction Helper ---
def predict_salary(data: dict) -> float:
    df_enc = encoder.transform(pd.DataFrame([data], columns=FEATURES))
    return float(model.predict(df_enc)[0])


# --- Routes ---

# Home: show index.html with form (posts to /predict) and table
@app.route('/')
def index():
    employees = Employee.query.all()
    return render_template('index.html', employees=employees)

# Step 1: Predict route
@app.route('/predict', methods=['POST'])
def predict_form():
    form = request.form
    # build payload for prediction
    payload = {
        'Age': int(form['age']),
        'Gender': form['gender'],
        'Education Level': form['education_level'],
        'Job Title': form['job_title'],
        'Years of Experience': float(form['experience'])
    }
    predicted = predict_salary(payload)
    # render confirm.html, carrying form data + prediction
    return render_template(
        'confirm.html',
        name=form['name'],
        payload=payload,
        predicted=predicted
    )

# Step 2: Add employee with actual salary
@app.route('/add', methods=['POST'])
def add_employee():
    form = request.form
    # rebuild payload
    payload = {
        'Age': int(form['age']),
        'Gender': form['gender'],
        'Education Level': form['education_level'],
        'Job Title': form['job_title'],
        'Years of Experience': float(form['experience'])
    }
    predicted = float(form['predicted_salary'])
    actual    = float(form['actual_salary'])
    name      = form['name']

    emp = Employee(
        name=name,
        age=payload['Age'],
        gender=payload['Gender'],
        education_level=payload['Education Level'],
        job_title=payload['Job Title'],
        experience=payload['Years of Experience'],
        actual_salary=actual,
        predicted_salary=predicted
    )
    db.session.add(emp)
    db.session.commit()
    flash(f'Added {name} (Actual: ₹{actual:.2f}, Predicted: ₹{predicted:.2f})', 'success')
    return redirect(url_for('index'))

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_employee(id):
    emp = Employee.query.get_or_404(id)

    if request.method == 'POST':
        form = request.form

        # Store original values for comparison
        original = {
            'name': emp.name,
            'age': emp.age,
            'gender': emp.gender,
            'education_level': emp.education_level,
            'job_title': emp.job_title,
            'experience': emp.experience,
            'actual_salary': emp.actual_salary,
        }

        # Update fields from form
        emp.name            = form['name']
        emp.age             = int(form['age'])
        emp.gender          = form['gender']
        emp.education_level = form['education_level']
        emp.job_title       = form['job_title']
        emp.experience      = float(form['experience'])
        emp.actual_salary   = float(form['actual_salary'])

        # Predict new salary
        payload = {
            'Age': emp.age,
            'Gender': emp.gender,
            'Education Level': emp.education_level,
            'Job Title': emp.job_title,
            'Years of Experience': emp.experience
        }
        emp.predicted_salary = predict_salary(payload)

        # Track changes
        changed = []
        for key, old_value in original.items():
            new_value = getattr(emp, key)
            if old_value != new_value:
                changed.append(f"{key.replace('_', ' ').title()}")

        db.session.commit()

        # Flash with detail
        if changed:
            fields = ', '.join(changed)
            flash(f"Updated {emp.name}'s fields: {fields}", 'success')
        else:
            flash(f"No changes made to {emp.name}", 'info')

        return redirect(url_for('employees_table'))

    return render_template('edit_employee.html', employee=emp)

@app.route('/predict_salary_api', methods=['POST'])
def predict_salary_api():
    data = request.get_json()

    payload = {
        'Age': int(data['age']),
        'Gender': data['gender'],
        'Education Level': data['education_level'],
        'Job Title': data['job_title'],
        'Years of Experience': float(data['experience']),
    }

    predicted = predict_salary(payload)
    return {'predicted_salary': round(predicted, 2)}


# Delete employee
@app.route('/delete/<int:id>')
def delete_employee(id):
    emp = Employee.query.get_or_404(id)
    db.session.delete(emp)
    db.session.commit()
    flash(f'Deleted {emp.name}', 'info')
    return redirect(url_for('index'))

# API: Predict via JSON
@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json(force=True)
    try:
        pred = predict_salary(data)
        return jsonify({'predicted_salary': pred})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# API: List employees
@app.route('/api/employees')
def api_employees():
    emps = Employee.query.all()
    return jsonify([{
        'id':               e.id,
        'name':             e.name,
        'job_title':        e.job_title,
        'gender':           e.gender,
        'education_level':  e.education_level,
        'experience':       e.experience,
        'age': e.age,
        'actual_salary':    e.actual_salary,
        'predicted_salary': e.predicted_salary
    } for e in emps])


# Dashboard page
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Bulk CSV upload
@app.route('/upload', methods=['POST'])
def upload_csv():
    file = request.files.get('file')
    if not file:
        flash('No file selected', 'danger')
        return redirect(url_for('index'))

    df = pd.read_csv(file)
    # rename variants
    df.rename(columns={
        'YearsExperience':  'Years of Experience',
        'Years_Experience': 'Years of Experience',
        'Experience':       'Years of Experience',
        'EducationLevel':   'Education Level',
        'JobTitle':         'Job Title'
    }, inplace=True)

    required = ['Age','Gender','Education Level','Job Title','Years of Experience','Salary']
    added = 0

    for idx, row in df.iterrows():
        if any(col not in row or pd.isna(row[col]) for col in required):
            continue
        try:
            payload = {
                'Age': int(row['Age']),
                'Gender': row['Gender'],
                'Education Level': row['Education Level'],
                'Job Title': row['Job Title'],
                'Years of Experience': float(row['Years of Experience'])
            }
            actual = float(row['Salary'])
        except (ValueError, TypeError):
            continue

        pred = predict_salary(payload)
        name = f"Employee {idx+1}"
        emp = Employee(
            name=name,
            age=payload['Age'],
            gender=payload['Gender'],
            education_level=payload['Education Level'],
            job_title=payload['Job Title'],
            experience=payload['Years of Experience'],
            actual_salary=actual,
            predicted_salary=pred
        )
        db.session.add(emp)
        added += 1

    db.session.commit()
    skipped = len(df) - added
    flash(f'Successfully uploaded {added} employees (skipped {skipped} invalid rows).', 'success')
    return redirect(url_for('index'))

# Export CSV
@app.route('/export')
def export_csv():
    emps = Employee.query.all()
    df = pd.DataFrame([{
        'Name':               e.name,
        'Age':                e.age,
        'Gender':             e.gender,
        'Education Level':    e.education_level,
        'Job Title':          e.job_title,
        'Years of Experience':e.experience,
        'Actual Salary':      e.actual_salary,
        'Predicted Salary':   e.predicted_salary
    } for e in emps])

    csv_data = df.to_csv(index=False)
    return Response(
        csv_data, mimetype="text/csv",
        headers={"Content-Disposition":"attachment;filename=employees.csv"}
    )

# Export Excel
@app.route('/export_excel')
def export_excel():
    emps = Employee.query.all()
    df = pd.DataFrame([{
        'Name':               e.name,
        'Age':                e.age,
        'Gender':             e.gender,
        'Education Level':    e.education_level,
        'Job Title':          e.job_title,
        'Years of Experience':e.experience,
        'Actual Salary':      e.actual_salary,
        'Predicted Salary':   e.predicted_salary
    } for e in emps])

    out = BytesIO()
    with pd.ExcelWriter(out, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Employees')
    out.seek(0)
    return send_file(
        out, download_name="employees.xlsx", as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/employees_table')
def employees_table():
    employees = Employee.query.all()
    return render_template('employees.html', employees=employees)


# Bootstrap the DB and run
if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)

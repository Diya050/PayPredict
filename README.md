# PayPredict: Employee Salary Prediction and Management System

**PayPredict** is a modern web app tailored for HR professionals, offering a powerful platform to **manage and analyze employee data** with ease. It seamlessly integrates a predictive engine that estimates monthly salaries based on key demographic and professional attributes—such as age, gender, education level, job title, and years of experience. 

The application enables **real-time salary predictions** during data entry, streamlining decision-making and onboarding processes. Designed with a **user-friendly interface**, PayPredict empowers HR teams to optimize workforce planning, **perform trend analysis**, and ensure compensation alignment with industry standards.


## Home View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/home_page_1.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/home_page_2.png" />

## Add Employee View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/add_employee_1.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/add_employee_2.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/add_employee_3.png" />


## Employee Records View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/view_employees_1.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/view_employees_2.png" />



## Employee Records With Filters View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/view_employees_filter.png" />





## Edit Employee View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/edit_employee_1.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/edit_employee_2.png" />


## Salary Insights Dashboard View:
<img width="1863" height="1011" alt="home_page_1" src="Previews/dashboard_1.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/dashboard_2.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/dashboard_3.png" />
<img width="1863" height="1011" alt="home_page_1" src="Previews/dashboard_4.png" />

---

## Key Features

* **CRUD Employee Records:**<br>
  Full support for adding, viewing, updating, and deleting employee profiles. Each record includes both actual and predicted salary values.
  
* **Filterable & Searchable Table:**<br>
  Quickly locate employees using:<br>

  * Search by **name**
  * Multi‑filters: **Job Title**, **Gender**, **Education**
  * Salary range filters (**Min/Max Actual Salary**, **Min/Max Age**, **Min/Max Experience**)
  * Dynamic result counter showing how many entries match your criteria

* **Bulk CSV Upload & Export:**<br>
  Efficiently import large datasets in CSV format and export records to CSV or Excel for reporting or analysis.

* **Interactive Dashboard:**<br>
  Provides dynamic filtering and insightful visual summaries:

  * **KPI Cards**: Total Employees | Average Actual Salary | Average Predicted Salary | Prediction Accuracy (R²)
  * **Filters**: Job Title | Gender | Education Level
  * **Visual Insights**:

    * **Scatter Chart** – Actual vs Predicted Salaries
    * **Horizontal Bar Chart** – Average Salary by Job Title
    * **Doughnut Chart** – Salary Distribution by Gender
    * **Line Chart** – Experience vs Average Salary
    * **Histogram** – Employee Age Distribution
    * **100% Stacked Bar** – Gender Ratio per Job Title

* **Real‑Time Salary Prediction:**<br>
  Users can obtain salary predictions instantly while entering employee data—before confirming the record.

* **Robust Machine Learning Integration:**<br>
  Backed by a trained Gradient Boosting model (0.90+ R² score) with target encoding for accurate and reliable salary forecasts.

---

## Tech Stack

- **Backend**: Python, Flask, SQLAlchemy  
- **Model**: scikit‑learn (Gradient Boosting), `category_encoders`  
- **Frontend**: HTML, Bootstrap 5, Chart.js, JavaScript  
- **Database**: SQLite  
- **Data I/O**: pandas for CSV and Excel handling

---

## Project Structure

```
PayPredict/
├── app.py
├── requirements.txt
├── model/
│   ├── salary\_predictor\_gb.pkl
│   └── target\_encoder.pkl
├── templates/
│   ├── index.html
│   ├── edit\_employee.html
│   ├── employees\_table.html
│   └── dashboard.html
│   └── confirm.html
├── static/
│   ├── css/style.css
│   └── js/dashboard.js
├── instance/
│   └── database.db
├── README.md
├── Previews
├── Salary_Data.csv
└── SalaryPrediction.ipynb

````

---

## Setup Instructions

1. **Clone the repository:**
```bash
git clone https://github.com/Diya050/PayPredict.git
cd PayPredict
````

2. **Set up a virtual environment:**

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows PowerShell
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Run the application:**

```bash
python app.py
```

5. **Open your browser:** At [http://127.0.0.1:5000](http://127.0.0.1:5000).


---
## Model Training

Jupyter Notebook for training and evaluating the Employee Salary Prediction model:

[Salary Model Training Notebook](SalaryPrediction.ipynb)

Kaggle Dataset Used: [Salary_Data.csv](https://www.kaggle.com/datasets/mohithsairamreddy/salary-data)

---

## Web App Previews

Check out live UI previews in the [Previews folder](https://github.com/Diya050/PayPredict/tree/main/Previews).

---

## About the Author

**Diya Baweja**<br>
GitHub: [@Diya050](https://github.com/Diya050)

---

> Upgrade your HR analytics with **PayPredict** — precise, professional, and powerful.


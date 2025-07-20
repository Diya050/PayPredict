document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/employees";
  let allData = [];

  const filters = {
    job: document.getElementById("filter-job"),
    gender: document.getElementById("filter-gender"),
    edu: document.getElementById("filter-edu"),
  };

  const charts = {
    scatter: new Chart(document.getElementById("chart-scatter"), {
      type: "scatter",
      data: { datasets: [] },
      options: {
        plugins: { title: { display: true, text: 'Predicted vs Actual Salary' }},
        scales: { x: { title: { display: true, text: 'Actual Salary (₹)' }},
                  y: { title: { display: true, text: 'Predicted Salary (₹)' }}}
      }
    }),
    bar: new Chart(document.getElementById("chart-bar"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Avg Actual Salary", data: [], backgroundColor: "#4e79a7" }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }} }
    }),
    pie: new Chart(document.getElementById("chart-pie"), {
      type: "doughnut",
      data: { labels: [], datasets: [{ data: [], backgroundColor: ["#f28e2b", "#e15759", "#76b7b2"] }] },
      options: { plugins: { legend: { position: 'bottom' }} }
    }),
    line: new Chart(document.getElementById("chart-line"), {
      type: "line",
      data: { labels: [], datasets: [{ label: "Avg Salary", data: [], borderColor: "#59a14f", tension: 0.3 }] },
      options: { plugins: { legend: { display: false }} }
    })
  };

  function loadFilters(data) {
    const jobSet = new Set(), genderSet = new Set(), eduSet = new Set();
    data.forEach(d => {
      jobSet.add(d.job_title);
      genderSet.add(d.gender);
      eduSet.add(d.education_level);
    });
    [filters.job, filters.gender, filters.edu].forEach(select => select.innerHTML = '<option value="">All</option>');
    jobSet.forEach(j => filters.job.innerHTML += `<option>${j}</option>`);
    genderSet.forEach(g => filters.gender.innerHTML += `<option>${g}</option>`);
    eduSet.forEach(e => filters.edu.innerHTML += `<option>${e}</option>`);
  }

  function updateKPI(data) {
    const total = data.length;
    const avgActual = data.reduce((sum, d) => sum + d.actual_salary, 0) / total || 0;
    const avgPred = data.reduce((sum, d) => sum + d.predicted_salary, 0) / total || 0;
    const r2 = 1 - data.reduce((sum, d) => sum + Math.pow(d.actual_salary - d.predicted_salary, 2), 0) /
                  data.reduce((sum, d) => sum + Math.pow(d.actual_salary - avgActual, 2), 0);
    document.getElementById("kpi-total").innerText = total;
    document.getElementById("kpi-avg-actual").innerText = `₹${avgActual.toFixed(0)}`;
    document.getElementById("kpi-avg-predicted").innerText = `₹${avgPred.toFixed(0)}`;
    document.getElementById("kpi-accuracy").innerText = `${(r2 * 100).toFixed(1)}%`;
  }

  function updateCharts(data) {
    // Scatter: Predicted vs Actual
    charts.scatter.data.datasets = [{
      label: 'Employees',
      data: data.map(d => ({ x: d.actual_salary, y: d.predicted_salary })),
      backgroundColor: "#4e79a7"
    }];
    charts.scatter.update();

    // Bar: Avg Salary by Job Title
    const jobs = [...new Set(data.map(d => d.job_title))];
    const avgByJob = jobs.map(job => {
      const group = data.filter(d => d.job_title === job);
      return group.reduce((sum, d) => sum + d.actual_salary, 0) / group.length;
    });
    charts.bar.data.labels = jobs;
    charts.bar.data.datasets[0].data = avgByJob;
    charts.bar.update();

    // Pie: Salary Distribution by Gender
    const genders = [...new Set(data.map(d => d.gender))];
    const salaryByGender = genders.map(g => {
      const group = data.filter(d => d.gender === g);
      return group.reduce((sum, d) => sum + d.actual_salary, 0);
    });
    charts.pie.data.labels = genders;
    charts.pie.data.datasets[0].data = salaryByGender;
    charts.pie.update();

    // Line: Experience vs Avg Salary
    const expBins = [...new Set(data.map(d => Math.round(d.experience)))].sort((a, b) => a - b);
    const avgByExp = expBins.map(exp => {
      const group = data.filter(d => Math.round(d.experience) === exp);
      return group.reduce((sum, d) => sum + d.actual_salary, 0) / group.length;
    });
    charts.line.data.labels = expBins;
    charts.line.data.datasets[0].data = avgByExp;
    charts.line.update();
  }

  function applyFilters() {
    const filtered = allData.filter(d =>
      (!filters.job.value || d.job_title === filters.job.value) &&
      (!filters.gender.value || d.gender === filters.gender.value) &&
      (!filters.edu.value || d.education_level === filters.edu.value)
    );
    updateKPI(filtered);
    updateCharts(filtered);
  }

  // Load Data
  fetch(API_URL).then(res => res.json()).then(data => {
    allData = data;
    loadFilters(data);
    applyFilters();
  });

  filters.job.addEventListener("change", applyFilters);
  filters.gender.addEventListener("change", applyFilters);
  filters.edu.addEventListener("change", applyFilters);
});

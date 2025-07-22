document.addEventListener("DOMContentLoaded", () => {
  Chart.defaults.color = '#f1f5f9'; // Light font color for dark mode
  Chart.defaults.plugins.legend.labels.color = '#f1f5f9'; // Legend color
  Chart.defaults.plugins.title.color = '#f1f5f9'; // Chart title color

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
        plugins: { title: { display: true, text: 'Predicted vs Actual Salary' } },
        scales: {
          x: { title: { display: true, text: 'Actual Salary (₹)' } },
          y: { title: { display: true, text: 'Predicted Salary (₹)' } }
        }
      }
    }),
    bar: new Chart(document.getElementById("chart-bar"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Avg Actual Salary", data: [], backgroundColor: "#42f982ff" }] },
      // options: { indexAxis: 'y', plugins: { legend: { display: true } } }
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              autoSkip: false, // Don’t skip job titles
              maxTicksLimit: 50 // Optional: limit number of ticks
            }
          }
        }
      }

    }),
    pie: new Chart(document.getElementById("chart-pie"), {
      type: "doughnut",
      data: { labels: [], datasets: [{ data: [], backgroundColor: ["#f29e4bff", "#ff6669ff", "#30baafff"] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    }),
    line: new Chart(document.getElementById("chart-line"), {
      type: "line",
      data: { labels: [], datasets: [{ label: "Avg Salary", data: [], borderColor: "#b6ef6cf5", tension: 0.3 }] },
      options: { plugins: { legend: { display: false } } }
    }),
    eduBar: new Chart(document.getElementById("chart-box"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Avg Salary by Education", data: [], backgroundColor: "#edc948" }] },
      options: { plugins: { legend: { display: false } } }
    }),
    age: new Chart(document.getElementById("chart-age"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Employee Count", data: [], backgroundColor: "#14e4c8ff" }] },
      options: {
        plugins: { title: { display: false, text: "Age Distribution" } },
        scales: {
          x: { title: { display: true, text: "Age Groups" } },
          y: { title: { display: true, text: "Number of Employees" } }
        }
      }
    }),

    genderStack: new Chart(document.getElementById("chart-stacked-bar"), {
      type: "bar",
      data: { labels: [], datasets: [] },
      options: {
        indexAxis: 'y', // horizontal
        plugins: {
          title: { display: false, text: "Gender Ratio per Job Title" },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x.toFixed(1)}%`
            }
          },
          legend: { position: 'bottom' }
        },
        responsive: true,
        scales: {
          x: {
            stacked: true,
            ticks: {
              callback: value => `${value}%`
            }
          },
          y: { stacked: true }
        }
      }
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
      backgroundColor: "#a0c9f2ff",
      borderColor: "#1d334aff"
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

    // Histogram: Age Distribution
    const ageBins = ["20-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51+"];
    const ageCounts = [0, 0, 0, 0, 0, 0, 0];

    data.forEach(d => {
      const age = Math.floor(d.age); // Assuming "age" field exists
      if (age >= 20 && age <= 25) ageCounts[0]++;
      else if (age >= 26 && age <= 30) ageCounts[1]++;
      else if (age >= 31 && age <= 35) ageCounts[2]++;
      else if (age >= 36 && age <= 40) ageCounts[3]++;
      else if (age >= 41 && age <= 45) ageCounts[4]++;
      else if (age >= 46 && age <= 50) ageCounts[5]++;
      else if (age >= 51) ageCounts[6]++;
    });

    charts.age.data.labels = ageBins;
    charts.age.data.datasets[0].data = ageCounts;
    charts.age.update();


    // Line: Experience vs Avg Salary
    const expBins = [...new Set(data.map(d => Math.round(d.experience)))].sort((a, b) => a - b);
    const avgByExp = expBins.map(exp => {
      const group = data.filter(d => Math.round(d.experience) === exp);
      return group.reduce((sum, d) => sum + d.actual_salary, 0) / group.length;
    });
    charts.line.data.labels = expBins;
    charts.line.data.datasets[0].data = avgByExp;
    charts.line.update();

    // Avg Salary by Education Level
    const edus = [...new Set(data.map(d => d.education_level))];
    const avgByEdu = edus.map(edu => {
      const group = data.filter(d => d.education_level === edu);
      return group.reduce((sum, d) => sum + d.actual_salary, 0) / group.length;
    });
    charts.eduBar.data.labels = edus;
    charts.eduBar.data.datasets[0].data = avgByEdu;
    charts.eduBar.update();

    // Gender Ratio per Job Title (100% stacked)
    const genderRatioData = genders.map(gender => {
      return jobs.map(job => {
        const group = data.filter(d => d.job_title === job);
        const genderCount = group.filter(d => d.gender === gender).length;
        const totalCount = group.length || 1; // prevent div by zero
        return (genderCount / totalCount) * 100; // percentage
      });
    });
    charts.genderStack.data.labels = jobs;
    charts.genderStack.data.datasets = genders.map((gender, idx) => ({
      label: gender,
      data: genderRatioData[idx],
      backgroundColor: ["#44a2f4ff", "#ece11fff", "#f9810aff"][idx % 3]
    }));
    charts.genderStack.update();
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

  fetch(API_URL).then(res => res.json()).then(data => {
    allData = data;
    loadFilters(data);
    applyFilters();
  });

  filters.job.addEventListener("change", applyFilters);
  filters.gender.addEventListener("change", applyFilters);
  filters.edu.addEventListener("change", applyFilters);
});

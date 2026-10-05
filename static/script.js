// The API uses keys like "armoured_fighting_vehicles"; make them readable.
const LABELS = {
    personnel_units: "Personnel",
    tanks: "Tanks",
    armoured_fighting_vehicles: "Armoured vehicles",
    artillery_systems: "Artillery",
    mlrs: "Rocket launchers (MLRS)",
    aa_warfare_systems: "Air defence",
    planes: "Planes",
    helicopters: "Helicopters",
    vehicles_fuel_tanks: "Vehicles and fuel tanks",
    warships_cutters: "Warships and boats",
    cruise_missiles: "Cruise missiles",
    uav_systems: "Drones",
    special_military_equip: "Special equipment",
    atgm_srbm_systems: "Missile systems (ATGM/SRBM)",
    submarines: "Submarines",
};

const number = new Intl.NumberFormat("en-US");
let chart;

async function loadLatest() {
    const response = await fetch("/latest");
    const rows = await response.json();

    const tbody = document.getElementById("results");

    for (const row of rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${LABELS[row.category] || row.category}</td>
            <td>+${number.format(row.increase)}</td>
            <td>${number.format(row.total)}</td>
        `;
        tr.addEventListener("click", () => loadChart(row.category));
        tbody.appendChild(tr);
    }

    document.getElementById("meta").textContent = rows[0].date;
}

async function loadChart(category) {
    const response = await fetch(`/history/${category}`);
    const rows = await response.json();

    document.getElementById("chart-title").textContent = LABELS[category] || category;

    // Draw the chart once, then only swap its data when the category changes.
    if (chart) {
        chart.data.labels = rows.map(r => r.date);
        chart.data.datasets[0].data = rows.map(r => r.total);
        chart.update();
        return;
    }

    chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels: rows.map(r => r.date),
            datasets: [{
                data: rows.map(r => r.total),
                borderColor: "#111111",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0,
            }],
        },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6, color: "rgba(17,17,17,0.6)" } },
                y: { grid: { color: "rgba(17,17,17,0.08)" }, ticks: { color: "rgba(17,17,17,0.6)" } },
            },
        },
    });
}

loadLatest();
loadChart("tanks");

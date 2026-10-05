// The API uses keys like "armoured_fighting_vehicles". This object gives
// each one a readable name, and its order is the order of the report list.
const LABELS = {
    personnel_units: "Personnel",
    tanks: "Tanks",
    armoured_fighting_vehicles: "Armoured vehicles",
    artillery_systems: "Artillery",
    mlrs: "Rocket launchers",
    aa_warfare_systems: "Air defence",
    planes: "Planes",
    helicopters: "Helicopters",
    uav_systems: "Drones",
    cruise_missiles: "Cruise missiles",
    warships_cutters: "Warships and boats",
    submarines: "Submarines",
    vehicles_fuel_tanks: "Vehicles and fuel tanks",
    special_military_equip: "Special equipment",
    atgm_srbm_systems: "Missile systems",
};

const INK = "#141310";
const GREY = "rgba(20, 19, 16, 0.42)";
// Canvas text needs fallbacks too, or it drops to a serif while the font loads.
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const number = new Intl.NumberFormat("en-US");

let chart;
let selected = "tanks";

// ---------- Latest report: hero, notes, list, about ----------
async function loadLatest() {
    const response = await fetch("/latest");
    const rows = await response.json();

    // Turn the list of rows into an object: { tanks: {total, increase}, ... }
    const byCategory = {};
    for (const row of rows) {
        byCategory[row.category] = row;
    }
    const date = rows[0].date;

    // Hero: the number that sets the scale.
    const personnel = byCategory.personnel_units;
    document.getElementById("hero").innerHTML =
        `${number.format(personnel.total)}<br>Russian personnel losses`;
    document.getElementById("day").textContent = `Day ${warDay(date)}`;
    document.getElementById("report-date").textContent = date;
    document.getElementById("report-date-2").textContent = date;

    // Notes: three things that happened today.
    const notes = ["personnel_units", "uav_systems", "artillery_systems"];
    document.getElementById("notes").innerHTML = notes.map((key, i) => `
        <li>
            <span class="index">${i + 1}</span>
            <span><span class="mono">+${number.format(byCategory[key].increase)}</span>
            ${LABELS[key].toLowerCase()} today</span>
        </li>
    `).join("");

    // Report list, in the order of LABELS.
    const list = document.getElementById("list");
    Object.keys(LABELS).forEach((key, i) => {
        const row = byCategory[key];
        if (!row) return;
        const li = document.createElement("li");
        li.innerHTML = `
            <button data-category="${key}">
                <span class="index">${String(i + 1).padStart(2, "0")}</span>
                <span class="label">${LABELS[key]}</span>
                <span class="today">+${number.format(row.increase)}</span>
                <span class="total">${number.format(row.total)}</span>
            </button>
        `;
        li.querySelector("button").addEventListener("click", () => {
            selectCategory(key);
            document.getElementById("chart").scrollIntoView();
        });
        list.appendChild(li);
    });

    document.getElementById("coverage").textContent = `2022-02-24 → ${date}`;
}

// Day 1 of the full-scale invasion is 24 Feb 2022.
function warDay(date) {
    const start = new Date("2022-02-24");
    const today = new Date(date);
    return Math.round((today - start) / 86400000) + 1;
}

// ---------- One category: chart + years ----------
async function selectCategory(category) {
    selected = category;

    const response = await fetch(`/history/${category}`);
    const rows = await response.json();
    const name = LABELS[category] || category;

    document.querySelectorAll(".list button").forEach(button => {
        button.classList.toggle("active", button.dataset.category === category);
    });

    const last = rows[rows.length - 1];
    document.getElementById("chart-label").textContent =
        `${name} · ${number.format(last.total)}`;
    document.getElementById("years-title").textContent = `${name} per year`;

    drawChart(rows);
    drawYears(rows);
}

function drawChart(rows) {
    const labels = rows.map(r => r.date);
    const data = rows.map(r => r.total);

    // Draw once, then only swap the data when the category changes.
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
        return;
    }

    const ticks = { color: GREY, font: { family: MONO, size: 10 } };

    chart = new Chart(document.getElementById("canvas"), {
        type: "line",
        data: {
            labels,
            datasets: [{ data, borderColor: INK, borderWidth: 1, pointRadius: 0, tension: 0 }],
        },
        options: {
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#EDEDEB",
                    titleColor: INK,
                    bodyColor: INK,
                    titleFont: { family: MONO, size: 10, weight: "normal" },
                    bodyFont: { family: MONO, size: 11 },
                    displayColors: false,
                    cornerRadius: 0,
                    callbacks: { label: item => number.format(item.raw) },
                },
            },
            // No grid lines, no axis lines: separate with space, not lines.
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { ...ticks, maxTicksLimit: 5, maxRotation: 0, callback: (v, i) => labels[i].slice(0, 7) },
                },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { ...ticks, maxTicksLimit: 4, callback: v => number.format(v) },
                },
            },
        },
    });
}

// Losses per year = total at the end of the year minus total at the end of the year before.
function drawYears(rows) {
    const lastTotalOfYear = {};
    for (const row of rows) {
        lastTotalOfYear[row.date.slice(0, 4)] = row.total;
    }

    let previous = 0;
    const items = Object.keys(lastTotalOfYear).map(year => {
        const lost = lastTotalOfYear[year] - previous;
        previous = lastTotalOfYear[year];
        return `
            <li>
                <p class="year">${year}<span>)</span></p>
                <p class="value">${number.format(lost)}</p>
            </li>
        `;
    });
    document.getElementById("year-row").innerHTML = items.join("");
}

// ---------- Menu: underline the section on screen ----------
const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        document.querySelectorAll(".links a").forEach(a => {
            a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`);
        });
    }
}, { threshold: 0.5 });

document.querySelectorAll(".screen").forEach(section => observer.observe(section));

loadLatest().then(() => selectCategory(selected));

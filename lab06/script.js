const salesData = {
    electronics: {
        bar: [120000, 150000, 140000, 170000, 160000, 190000, 210000, 220000, 180000, 250000, 280000, 350000],
        line2024: [100000, 110000, 105000, 120000, 115000, 130000, 140000, 145000, 135000, 160000, 180000, 220000],
        line2025: [120000, 150000, 140000, 170000, 160000, 190000, 210000, 220000, 180000, 250000, 280000, 350000]
    },
    clothing: {
        bar: [45000, 50000, 65000, 80000, 75000, 60000, 55000, 70000, 90000, 110000, 95000, 130000],
        line2024: [40000, 42000, 55000, 70000, 68000, 50000, 48000, 60000, 75000, 90000, 85000, 110000],
        line2025: [45000, 50000, 65000, 80000, 75000, 60000, 55000, 70000, 90000, 110000, 95000, 130000]
    },
    books: {
        bar: [25000, 28000, 27000, 23000, 20000, 18000, 19000, 22000, 30000, 32000, 40000, 55000],
        line2024: [20000, 22000, 21000, 19000, 17000, 15000, 16000, 18000, 24000, 26000, 32000, 45000],
        line2025: [25000, 28000, 27000, 23000, 20000, 18000, 19000, 22000, 30000, 32000, 40000, 55000]
    }
};

const months = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Верес', 'Жовт', 'Лист', 'Груд'];

let currentCategory = 'electronics';

// Bar Chart
const ctxBar = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(ctxBar,       {
    type: 'bar',
    data: {
        labels: months,
        datasets: [{
            label: 'Продажі (грн)',
            data: salesData[currentCategory].bar,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
    }
});

// Line Chart
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels: months,
        datasets: [
            {
                label: '2024 рік',
                data: salesData[currentCategory].line2024,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                fill: true,
                tension: 0.3
            },
            {
                label: '2025 рік',
                data: salesData[currentCategory].line2025,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                fill: true,
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
    }
});

const selectElement = document.getElementById('categorySelect');

selectElement.addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    
    console.log(`Категорію змінено на: ${selectedCategory}`);

    barChart.data.datasets[0].data = salesData[selectedCategory].bar;
    barChart.update();

    lineChart.data.datasets[0].data = salesData[selectedCategory].line2024;
    lineChart.data.datasets[1].data = salesData[selectedCategory].line2025;
    lineChart.update();
});
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard Chart
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Create stunning gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 210, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue',
                data: [65, 78, 66, 89, 76, 95, 110],
                borderColor: '#00d2ff',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#00d2ff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#11141b',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: 'Outfit'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: 'Outfit'
                        }
                    }
                }
            }
        }
    });

    // Sidebar interactivity
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Simulate real-time stats updates
    setInterval(() => {
        const activeUsersValue = document.querySelector('.users + .stat-info .value');
        if (activeUsersValue) {
            const currentUsers = parseInt(activeUsersValue.textContent.replace(',', ''));
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            activeUsersValue.textContent = (currentUsers + change).toLocaleString();
        }
    }, 3000);
});

// Cek login
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = "../Index.html";
        return;
    }
    document.getElementById('userFullName').textContent = currentUser.fullName;

    loadUserData(currentUser.id);
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = "../Index.html";
    });
});

function loadUserData(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    updateBalanceInfo(user);
    
    updateRecentTransactions(user.transactions);
    
    initializeCharts(user.transactions);
}

function updateBalanceInfo(user) {
    const formatCurrency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    if (user.transactions && user.transactions.length > 0) {
        user.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
    }
    
    const balance = totalIncome - totalExpense;
    
    // Update UI
    document.getElementById('totalBalance').textContent = formatCurrency.format(balance);
    document.getElementById('totalIncome').textContent = formatCurrency.format(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency.format(totalExpense);
}

function updateRecentTransactions(transactions) {
    const tableBody = document.getElementById('recentTransactionsTable');
    
    const formatCurrency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    
    tableBody.innerHTML = '';
    
    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada transaksi</td></tr>';
        return;
    }
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const recentTransactions = sortedTransactions.slice(0, 5);
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description || '-'}</td>
            <td>
                <span class="transaction-badge ${transaction.type === 'income' ? 'badge-income' : 'badge-expense'}">
                    ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
            </td>
            <td class="${transaction.type === 'income' ? 'income-text' : 'expense-text'}">
                ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency.format(transaction.amount)}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}


//code untuk chartjs
function initializeCharts(transactions) {
    if (!transactions || transactions.length === 0) {
        return;
    }
    
    const last6Months = getLastNMonths(6);
    const monthlyData = prepareMonthlyData(transactions, last6Months);
    
    const expenseCategories = prepareExpenseCategories(transactions);
    
    initializeMonthlyChart(monthlyData, last6Months);
    
    initializeExpenseChart(expenseCategories);
}

function getLastNMonths(n) {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < n; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.unshift({
            year: month.getFullYear(),
            month: month.getMonth(),
            label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(month) + ' ' + month.getFullYear()
        });
    }
    
    return months;
}

function prepareMonthlyData(transactions, months) {
    const incomeData = Array(months.length).fill(0);
    const expenseData = Array(months.length).fill(0);
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthIndex = months.findIndex(m => m.year === year && m.month === month);
        
        if (monthIndex !== -1) {
            if (transaction.type === 'income') {
                incomeData[monthIndex] += transaction.amount;
            } else {
                expenseData[monthIndex] += transaction.amount;
            }
        }
    });
    
    return {
        income: incomeData,
        expense: expenseData
    };
}

function prepareExpenseCategories(transactions) {
    const categories = {};
    
    // Hitung total per kategori
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }
            categories[transaction.category] += transaction.amount;
        }
    });
    
    // Konversi ke format yang dibutuhkan Chart.js
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    return { labels, data };
}

function initializeMonthlyChart(data, months) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: [{
                label: 'Pemasukan',
                data: data.income,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }, {
                label: 'Pengeluaran',
                data: data.expense,
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    });
}

function initializeExpenseChart(categories) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', 
        '#8AC249', '#EA80FC', '#00E5FF', '#FFD54F'
    ];
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.labels,
            datasets: [{
                data: categories.data,
                backgroundColor: backgroundColors.slice(0, categories.labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
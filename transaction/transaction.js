let currentUser;
let deleteTransactionId;
let allTransactions = [];
let filteredTransactions = [];

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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('date').valueAsDate = new Date();
    
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = "../Index.html";
        return;
    }
    
    document.getElementById('incomeBtn').addEventListener('click', function() {
        setTransactionType('income');
    });
    
    document.getElementById('expenseBtn').addEventListener('click', function() {
        setTransactionType('expense');
    });
    
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    document.getElementById('monthFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        deleteTransaction(deleteTransactionId);
        deleteModal.hide();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = "../Index.html";
    });
    
    // Load data transaksi
    loadTransactions();
});

function setTransactionType(type) {
    document.getElementById('transactionType').value = type;
    
    if (type === 'income') {
        document.getElementById('incomeBtn').classList.add('active');
        document.getElementById('expenseBtn').classList.remove('active');
        document.getElementById('incomeCategories').style.display = 'block';
        document.getElementById('expenseCategories').style.display = 'none';
        document.getElementById('category').selectedIndex = 0;
    } else {
        document.getElementById('incomeBtn').classList.remove('active');
        document.getElementById('expenseBtn').classList.add('active');
        document.getElementById('incomeCategories').style.display = 'none';
        document.getElementById('expenseCategories').style.display = 'block';
        document.getElementById('category').selectedIndex = 0;
    }
}

function handleTransactionSubmit(event) {
    event.preventDefault();
    
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    if (!amount || !category || !date) {
        alert('Silakan isi semua field yang diperlukan');
        return;
    }
    
    const newTransaction = {
        id: Date.now().toString(),
        type,
        amount,
        category,
        date,
        description
    };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) {
        alert('Terjadi kesalahan. Silakan login kembali.');
        return;
    }
    
    if (!users[userIndex].transactions) {
        users[userIndex].transactions = [];
    }
    
    users[userIndex].transactions.push(newTransaction);
    
    if (type === 'income') {
        users[userIndex].balance += amount;
    } else {
        users[userIndex].balance -= amount;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = users[userIndex];
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    document.getElementById('transactionForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    loadTransactions();
    
    alert('Transaksi berhasil disimpan');
}

function loadTransactions() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user) return;
    
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    allTransactions = user.transactions || [];
    
    applyFilters();
}

function applyFilters() {
    filteredTransactions = [...allTransactions];
    
    const monthFilter = document.getElementById('monthFilter').value;
    if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transDate = new Date(transaction.date);
            return transDate.getFullYear() === parseInt(year) && 
                    transDate.getMonth() === parseInt(month) - 1;
        });
    }
    
    const typeFilter = document.getElementById('typeFilter').value;
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(transaction => 
            transaction.type === typeFilter
        );
    }
    
    // Update tabel
    updateTransactionsTable();
}

function resetFilters() {
    document.getElementById('monthFilter').value = '';
    document.getElementById('typeFilter').value = 'all';
    applyFilters();
}

function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsTable');
    
    tableBody.innerHTML = '';
    
    if (!filteredTransactions || filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada transaksi</td></tr>';
        return;
    }
    
    const sortedTransactions = [...filteredTransactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(transaction => {
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
            <td>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            deleteTransactionId = this.getAttribute('data-id');
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
            deleteModal.show();
        });
    });
}

function deleteTransaction(transactionId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return;
    
    const transactionIndex = users[userIndex].transactions.findIndex(
        t => t.id === transactionId
    );
    
    if (transactionIndex === -1) return;
    
    const transaction = users[userIndex].transactions[transactionIndex];
    if (transaction.type === 'income') {
        users[userIndex].balance -= transaction.amount;
    } else {
        users[userIndex].balance += transaction.amount;
    }
    
    users[userIndex].transactions.splice(transactionIndex, 1);
    
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = users[userIndex];
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    loadTransactions();
    
    alert('Transaksi berhasil dihapus');
}
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak sama');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(user => user.email === email)) {
        alert('Email sudah terdaftar, silakan gunakan email lain.');
        return;
    }
    
    // Tambahkan user baru
    const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
        password,
        balance: 0,
        transactions: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registrasi berhasil! Silakan login.');
    window.location.href = "../index.html";
});
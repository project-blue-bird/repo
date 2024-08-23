const signupForm = document.querySelector('#signup-form');
const useridInput = document.querySelector('#userid');
const passwordInput = document.querySelector('#password');
const passwordRetypeInput = document.querySelector('#password-retype');
const emailInput = document.querySelector('#email');
const usernameInput = document.querySelector('#username');
const successMessage = document.querySelector('.success-message');
const failureMessage = document.querySelector('.failure-message');
const successPassword = document.querySelector('.success-password');
const failurePassword = document.querySelector('.failure-password');
const passwordRetypeMessage = document.querySelector('.password-retype-message');
const emailMessage = document.querySelector('.email-message');

// 아이디 유효성 검사
useridInput.addEventListener('input', function() {
    const userid = useridInput.value;
    let users = {};

    // 기존 사용자 데이터 불러오기
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        try {
            users = JSON.parse(storedUsers);
            // 데이터가 유효한지 확인
            if (typeof users !== 'object' || users === null) {
                users = {};
            }
        } catch (e) {
            console.error('Failed to parse user data from localStorage:', e);
            users = {};
        }
    }

    if (userid === '') {
        successMessage.classList.add('hide');
        failureMessage.classList.add('hide');
    } else if (userid.length < 4) {
        failureMessage.textContent = '아이디는 최소 4자 이상이어야 합니다.';
        failureMessage.classList.remove('hide');
        successMessage.classList.add('hide');
    } else if (users[userid]) { // 기존 사용자 확인
        failureMessage.textContent = '중복된 아이디입니다.';
        failureMessage.classList.remove('hide');
        successMessage.classList.add('hide');
    } else {
        successMessage.textContent = '사용할 수 있는 아이디입니다.';
        successMessage.classList.remove('hide');
        failureMessage.classList.add('hide');
    }
});

// 비밀번호 유효성 검사
passwordInput.addEventListener('input', function() {
    const password = passwordInput.value;

    if (password === '') {
        successPassword.classList.add('hide');
        failurePassword.classList.add('hide');
    } else if (password.length < 6) {
        failurePassword.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
        failurePassword.classList.remove('hide');
        successPassword.classList.add('hide');
    } else if (!/[!@#$%^&*]/.test(password)) {
        failurePassword.textContent = '비밀번호에는 특수문자가 포함되어야 합니다.';
        failurePassword.classList.remove('hide');
        successPassword.classList.add('hide');
    } else {
        successPassword.textContent = '사용할 수 있는 비밀번호입니다.';
        successPassword.classList.remove('hide');
        failurePassword.classList.add('hide');
    }
});

passwordRetypeInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const passwordRetype = passwordRetypeInput.value;

    if (passwordRetype === '') {
        passwordRetypeMessage.classList.add('hide');
    } else if (passwordRetype !== password) {
        passwordRetypeMessage.textContent = '비밀번호가 일치하지 않습니다.';
        passwordRetypeMessage.classList.remove('hide');
    } else {
        passwordRetypeMessage.textContent = '비밀번호가 일치합니다.';
        passwordRetypeMessage.classList.remove('hide');
    }
});

// 이메일 유효성 검사
emailInput.addEventListener('input', function() {
    const email = emailInput.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        emailMessage.classList.add('hide');
    } else if (!emailPattern.test(email)) {
        emailMessage.textContent = '유효한 이메일 주소를 입력해주세요.';
        emailMessage.classList.remove('hide');
    } else {
        emailMessage.textContent = '유효한 이메일 주소입니다.';
        emailMessage.classList.remove('hide');
    }
});

// 회원가입 제출 처리
signupForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const userid = useridInput.value;
    const password = passwordInput.value;
    const passwordRetype = passwordRetypeInput.value;
    const email = emailInput.value;
    const username = usernameInput.value;

    if (userid === '' || password === '' || passwordRetype === '' || email === '' || username === '') {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (userid.length < 4) {
        alert('아이디는 최소 4자 이상이어야 합니다.');
        return;
    }

    if (password.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }

    if (password !== passwordRetype) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordPattern.test(password)) {
        alert('비밀번호는 최소 6자 이상이며, 문자, 숫자 및 특수문자를 포함해야 합니다.');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('유효한 이메일 주소를 입력해주세요.');
        return;
    }

    // 비밀번호 해시화
    const hashedPassword = CryptoJS.SHA256(password).toString();

    // 기존 사용자 데이터 불러오기
    let users = {};
    const storedUsers = localStorage.getItem('users');

    if (storedUsers) {
        try {
            users = JSON.parse(storedUsers);
            // 데이터가 유효한지 확인
            if (typeof users !== 'object' || users === null) {
                users = {};
            }
        } catch (e) {
            console.error('Failed to parse user data from localStorage:', e);
            users = {};
        }
    }

    // 사용자 데이터 추가
    users[userid] = {
        id: userid,
        password: hashedPassword,
        username: username,
        email: email
    };

    // 사용자 데이터 저장
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save user data to localStorage:', e);
    }

    alert('회원가입 완료!');

    window.location.href = 'login.html';
});
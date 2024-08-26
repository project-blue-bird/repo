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


// 기존 사용자 데이터 불러오는 함수.
async function loadUsers() {
    try {
        const response = await fetch("https://mhd.hopto.org:8443/api/get-users", {
            method: "GET",
        });
        if (!response.ok) { // OK 하지 않으면 에러난거임.
            throw new Error(`에러: ${response.status}`);
        }
        const data = await response.json();
        if (typeof data !== "object" || data === null) {
            data = {};
        }
        return data;
    } catch (error) {
        console.error(`데이터 가져오기 오류: ${error}`);
        alert("제가 서버를 잘못만들어서 에러가 나버렸습니다.\n죽을 죄를 지었습니다.");
        return {};
    }
}


// 아이디 유효성 검사
loadUsers().then((responseData) => {
    let users;
    users = responseData.data;
    useridInput.addEventListener('input', function() {
        const userid = useridInput.value;
         // 기존 사용자 데이터 불러오기
    
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

    loadUsers().then((responseData) => {
        users = responseData.data; // 기존 사용자 데이터 불러오기
        users[userid] = {
            id: userid,
            password: hashedPassword,
            username: username,
            email: email
        }
        fetch("https://mhd.hopto.org:8443/api/signup", { // 양식 깔끔하게 잘 맞춰서 보내줘야 합니다.
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(users), // 사용자 데이터 추가
        }).then((response) => { // 사용자 데이터 저장
            if (!response.ok) {
                throw new Error(`에러: ${response.status}`);
            }
            return response.json(); // 서버의 응답.
        }).then((data) => {
            console.log(`응답: ${data}`);
            Swal.fire({
                icon: "success",
                title: "회원가입 완료!",
                showCancelButton: false,
                confirmButtonText: "확인"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login.html';
                } else if (result.isDismissed) {
                    window.location.href = 'login.html';
                }
            });
        }).catch(error => {
            console.error(`데이터 전송 오류: ${error}`);
            alert("제가 서버를 잘못만들어서 에러가 나버렸습니다.\n죄송합니다.");
        });
    });
});
const loginForm = document.querySelector('#login-form');
const useridInput = document.querySelector('#userid');
const passwordInput = document.querySelector('#password');
const signupButton = document.querySelector('#signup-button');


// 로그인 제출 처리
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const userid = useridInput.value;
    const password = passwordInput.value;

    if (userid === '' || password === '') {
        Swal.fire({
            icon: "error",
            title: "아이디와 비밀번호를 입력해주세요.",
            confirmButtonText: "확인"
        });
        return;
    }

    const hashedPassword = CryptoJS.SHA256(password).toString();
    fetch("https://mhd.hopto.org:8443/api/get-users", {
        method: "GET",
    }).then((response) => {
        if (!response.ok) { // OK 하지 않으면 에러난거임.
            throw new Error(`에러: ${response.status}`);
        }
        return response.json();
    }).then((responseData) => { // 바로 위에서 리턴된것 가져옴.
        if (responseData) {
            const users = responseData.data;
            if (users[userid] && users[userid].password === hashedPassword) {
                async function loadUsers() {
                    const response = await fetch("https://mhd.hopto.org:8443/api/get-chatting-users", {
                        method: "GET",
                    });
                    const data = await response.json();
                    return data;
                }
                loadUsers().then((responseData) => {
                    const chattingUserList = responseData.data;
                    if (!(chattingUserList.includes(userid))) {
                        // 로그인 성공 시 세션 저장
                        sessionStorage.setItem('userid', userid);

                        // 쿠키에 저장 (하루 동안 유지)
                        const expires = new Date();
                        expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24시간 후
                        document.cookie = `userid=${userid}; expires=${expires.toUTCString()}; path=/`;
                        window.location.href = 'chat.html';
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "이미 로그인중인 유저입니다.",
                            confirmButtonText: "확인"
                        });
                    }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "아이디 또는 비밀번호가 잘못되었습니다.",
                    confirmButtonText: "확인"
                });
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "아이디 또는 비밀번호가 잘못되었습니다.",
                confirmButtonText: "확인"
            });
        }
    }).catch((error) => {
        console.error(`데이터 가져오기 오류: ${error}`);
        alert("제가 서버를 잘못만들어서 에러가 나버렸습니다.\n죽을 죄를 지었습니다.");
    });
});
signupButton.addEventListener('click', function() {
    window.location.href = 'signup.html';
});
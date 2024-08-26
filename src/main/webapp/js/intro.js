$(document).ready(function () {
    const content = "Hello👋 \n Blue Bird.";
    let i = 0;
    let typingInterval;

    function typing() {
        if (i < content.length) {
            let txt = content[i++];
            $(".text").html($(".text").html() + (txt === "\n" ? "<br>" : txt));
        } else {
            // 타이핑 효과 멈추기
            clearInterval(typingInterval);

            // 'click' 텍스트 표시
            $(".click").fadeIn();

            // 블링크 커서 효과 유지
            $(".blink").fadeIn();

            // 15초 후 텍스트와 버튼 모두 다시 시작
            setTimeout(function () {
                $(".text").html(""); // 텍스트 지우기
                $(".click").fadeOut(); // 버튼 페이드 아웃
                $(".blink").fadeOut(); // 블링크 커서 페이드 아웃

                i = 0;
                typingInterval = setInterval(typing, 200); // 타이핑 효과 다시 시작
            }, 15000);
        }
    }

    // 페이지 로드 시 타이핑 효과 시작
    typingInterval = setInterval(typing, 200);

    // 버튼 클릭 시 페이지 이동
    $("#click-button").click(function () {
        window.location.href = "/views/login.html";
    });
});
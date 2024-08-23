$(document).ready(function () {
    const content = "Hello👋 \n Blue Bird.";
    let i = 0;

    function typing() {
        if(i < content.length) {
            let txt = content[i++];
            $(".text").html($(".text").html() + (txt === "\n" ? "<br>" : txt));
        } else {
            // 텍스트 타이핑 효과 멈추기
            clearInterval(typingInterval);
            // 'click' 텍스트 표시
            $(".click").fadeIn();

            // 15초 후 텍스트 타이핑 효과 다시 시작
            setTimeout(function () {
                $(".text").html("");
                // 'click' 텍스트 숨기기
                $(".click").fadeOut();
                i = 0;

                typingInterval = setInterval(typing, 200);
            }, 15000);
        }
    }

    let typingInterval =  setInterval(typing, 200);

    // $(".click").click(function () {
    //    window.location.href = "/views/login.html";
    // });
});
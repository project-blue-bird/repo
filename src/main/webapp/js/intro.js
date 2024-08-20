$(document).ready(function () {
   const content = "Hello. \n Blue Bird";
   let i = 0;

   function typing() {
       let txt = content[i++];
       $(".text").html($(".text").html() + (txt === "\n" ? "<br>" : txt));

       if(i > content.length) {
           $(".text").html("");
           i = 0;
       }
   }

   setInterval(typing, 200);
});
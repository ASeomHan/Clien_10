// 페이지 컨트롤 템플릿에 대한 소개는 다음 문서를 참조하십시오.
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    var sess = WinJS.Application.sessionState, // 세션
        postSubject, // 글 제목
        postDetail, // 작성자/작성시간
        postArticle, // 본문
        postImgs, // 첨부 이미지 Arr
        postReplyNicks, // 댓글 닉 Arr
        postReplyContents; // 댓글 내용 Arr

    WinJS.UI.Pages.define("/pages/view_post/view_post.html", {

        /* 페이지 로드됨 */
        ready: function (element, options) {
            document.querySelector('#disp-currentBoard').innerText = sess['currentBoardName']; // 게시판 이름 띄움
            this.showPost(sess['currentBoardId'], sess['currentPostId']);
        },

        /* 게시물 파싱 시작             */
        /* board  : String, 게시판 ID   */
        /* postId : Number, 게시물 번호 */
        showPost: function (board, postId) {

            // 30초 타임아웃
            WinJS.Promise.timeout(30000, WinJS.xhr({
                url: 'http://www.clien.net/cs2/bbs/board.php?bo_table=' + board + '&wr_id=' + postId
            }).done(this.showPost_completed.bind(this), this.connectError));
        },

        /* 파싱 성공                                   */
        /* xhrResult : Object, XHR 요청 후 반환된 결과 */
        showPost_completed: function (xhrResult) {
            // 웹 파싱 성공시 실행
            if (xhrResult.status !== 200) {
                // 오류, 접속 실패
                this.connectError();
                return;
            }

            var domParser = new DOMParser();
            var entireHtmlElement = domParser.parseFromString(xhrResult.responseText, 'text/html');

            postSubject = entireHtmlElement.querySelector('.board_main .view_title span');
            postDetail = entireHtmlElement.querySelector('.board_main .view_head');
            postArticle = entireHtmlElement.querySelector('.board_main .view_content #writeContents');

            if (!postSubject) {
                // TODO: 글 삭제된 경우와,
                // 열린 페이지가 게시물보기가 아닌경우를 구분해서 메시지 작성.
                var errorDialog = new Windows.UI.Popups.MessageDialog(
                    "존재하지 않는 게시물입니다.", "오류");
                errorDialog.commands.append(
                    new Windows.UI.Popups.UICommand("목록", function () {
                        WinJS.Navigation.back();
                    }));
                errorDialog.showAsync();
                return;
            }

            document.getElementById('postSubject').innerText = postSubject.innerText;
            document.getElementById('postDetail').innerHTML = postDetail.innerHTML.replace('/cs2', 'http://www.clien.net/cs2');
            document.getElementById('postArticle').innerHTML = postArticle.innerHTML;

            // 첨부이미지 존재시 #postImgs 요소 안에 하나하나 추가
            postImgs = entireHtmlElement.querySelectorAll('.board_main .view_content .attachedImage img');
            var imgsEle = document.getElementById('postImgs');
            if (postImgs.length != 0) {
                var imgTags = '';
                for (var i = 0; i < postImgs.length; i++) {
                    imgTags += '<img src="' + postImgs[i].src + '" /><br /><br />\n';
                }
                // 루프완료후 결과 넣어주는게 더 빠름
                imgsEle.innerHTML = imgTags;

            }

            // 댓글도 하나하나 추가
            postReplyNicks = entireHtmlElement.querySelectorAll('#comment_wrapper .user_id');
            postReplyContents = entireHtmlElement.querySelectorAll('#comment_wrapper .reply_content');
            var replysEle = document.getElementById('replys');
            if (postReplyContents.length != 0) {
                var replyTags = '';
                for (var i = 0; i < postReplyContents.length; i++) {
                    var nick = postReplyNicks[i].innerHTML
                        .replace('/cs2', 'http://www.clien.net/cs2')
                        .replace('..', 'http://www.clien.net/cs2');
                    var content = postReplyContents[i].innerHTML.replace(/<span[\s\S]*?value="">/, '');

                    var sourceArr = [];
                    if (nick.indexOf('blet_re2.gif') !== -1) {
                        // 닉네임 영역에 문자열 'blet_re2.gif' 존재 -> 대댓글임
                        sourceArr.push('<div class="daDatGul">');
                    } else {
                        sourceArr.push('<div>');
                    }
                    sourceArr.push('<h5 class="win-h5">' + nick + '</h5>');
                    sourceArr.push('<p>' + content + '</p>');
                    sourceArr.push('</div>');

                    replyTags += sourceArr.join('');
                }
                replysEle.innerHTML = replyTags;
            }

            // 로드끝
            var mainSection = document.getElementById('section_main');
            var progress = document.querySelector('#toolBarTitle progress');
            WinJS.UI.Animation.enterContent(mainSection);
            WinJS.UI.Animation.exitContent(progress);
        },

        /* 접속 실패 */
        connectError: function () {
            var errorDialog = new Windows.UI.Popups.MessageDialog(
                "글 목록을 불러오는 동안 오류가 발생했습니다.", "접속 오류");
            errorDialog.commands.append(new Windows.UI.Popups.UICommand("재시도", reloadClicked));
            errorDialog.commands.append(new Windows.UI.Popups.UICommand("닫기"));
            errorDialog.showAsync();
            function reloadClicked() {
                WinJS.Navigation.history.current.initialPlaceholder = true;
                WinJS.Navigation.navigate('/pages/view_post/view_post.html');
            }
        }
    });
})();

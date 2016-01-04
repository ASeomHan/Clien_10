(function () {
    "use strict";

    var sess = WinJS.Application.sessionState;
    // currentBoardId, currentBoardName, currentPageNum, currentPostId,
    // currentScrollPos, nav history

    var boardSelectorCmds, // 게시판 선택기의 각 항목 Arr
        cmdNextPage, // 다음페이지 버튼
        cmdPrevPage, // 이전
        currentPageDisp, // 현재페이지 표시 엘리먼트
        postSubjects, // 글제목 Arr
        postNicknames, // 닉 Arr
        postListView; // 리스트뷰

    WinJS.UI.Pages.define("/pages/post_list/post_list.html", {

        /* 페이지 로드됨 */
        ready: function (element, options) {

            // 글보기 -> 글목록 전환시 currentPostId를 삭제해야함
            if (sess['currentPostId']) {
                sess['currentPostId'] = undefined;
            }
            if (!sess['currentPageNum']) {
                sess['currentPageNum'] = 1;
            }
            if (!sess['currentBoardId']) {
                sess['currentBoardId'] = 'park';
            }
            boardSelectorCmds = document.querySelectorAll('#boardSelectFlyout .boardSel');
            this.dispCheckMark(sess['currentBoardId']); // 현재 페이지 첫접근시 dispCheckMark 실행

            if (sess['currentBoardName']) {
                document.querySelector('#disp-currentBoard').innerText = sess['currentBoardName']; // 게시판 이름 띄움
            } else {
                document.querySelector('#disp-currentBoard').innerText = "Clien 10"; // 첫실행시
            }

            // 게시판 선택메뉴에 리스너 추가
            var that = this;
            for (var i = 0; i < boardSelectorCmds.length; i++) {
                boardSelectorCmds[i].winControl.onclick = function (evt) {
                    // this == 이벤트 타겟이되는 menuCommand.winControl 객체
                    sess['currentBoardId'] = this.id;
                    that.dispCheckMark(sess['currentBoardId']); // 게시판 변경전 dispCheckMark 실행
                    that.showPostList(sess['currentBoardId'], sess['currentPageNum']);
                };
            }

            // 다음페이지버튼
            cmdNextPage = document.getElementById('cmd-nextPage').winControl;
            // 핸들러에서 'this'를 사용하면 기본적으로 이벤트 타겟을 가리켜 버리므로,
            // bind(this)로 '자신이 포함된 객체'를 가리키도록 만듦.                            ↓
            listener.addRemovable('toNextPage', cmdNextPage, 'click', this.handler_toNextPage.bind(this));
            // TODO: 페이지 언로드시 listener.remove.id 사용바람

            // 게시판 로드
            this.showPostList(sess['currentBoardId'], sess['currentPageNum']);

        },

        /* 게시판 파싱 시작                            */
        /* board        : String, 파싱할 게시판 ID     */
        /* boardPageNum : Number, 파싱할 게시판 페이지 */
        showPostList: function (board, boardPageNum) {
            // 이전페이지 버튼 처리
            cmdPrevPage = document.getElementById('cmd-prevPage').winControl;
            if (sess['currentPageNum'] <= 1 && listener.remove.toPrevPage) {
                // 페이지가 1 이하인데 이전버튼 리스너 존재
                cmdPrevPage.disabled = true;
                listener.remove.toPrevPage();
            } else if (sess['currentPageNum'] > 1 && !listener.remove.toPrevPage) {
                // 페이지가 1 이상인데 이전버튼 리스너 없음
                cmdPrevPage.disabled = false;
                listener.addRemovable('toPrevPage', cmdPrevPage, 'click', this.handler_toPrevPage.bind(this));
            }

            // 30초 타임아웃
            WinJS.Promise.timeout(30000, WinJS.xhr({
                url: 'http://www.clien.net/cs2/bbs/board.php?bo_table=' + board + '&page=' + boardPageNum
            }).then(this.showPostList_completed.bind(this), this.connectError));
        },

        /* 파싱 성공                                   */
        /* xhrResult : Object, XHR 요청 후 반환된 결과 */
        showPostList_completed: function (xhrResult) {
            if (xhrResult.status !== 200) {
                // 오류, 접속 실패
                this.connectError();
                return;
            }

            // 사이퍼님 닉네임의 자바스크립트 제거
            var string = xhrResult.responseText.replace(/<a href="javascript:;".*?>(.*?)<\/a>/g, '$1');
            var domParser = new DOMParser();
            // 웹에서 파싱된 'string'을 'DOM' document로 파싱.
            var htmlElement = domParser.parseFromString(string, 'text/html');

            var boardTitle = htmlElement.querySelector('title').innerText.match(/>\s(.*?)\d/);
            if (!boardTitle) {
                // 오류
                this.connectError();
                return;
            }

            sess['currentBoardName'] = boardTitle[1]; // HTML 소스에서 추출된 게시판 제목
            document.querySelector('#disp-currentBoard').innerText = sess['currentBoardName']; // 게시판 이름 갱신
            currentPageDisp = document.getElementById('disp-currentPage');
            WinJS.UI.Animation.fadeIn(currentPageDisp);
            currentPageDisp.innerText = sess['currentPageNum'] + ' 페이지'; // 페이지 번호 띄움


            postSubjects = htmlElement.querySelectorAll('.post_subject');
            postNicknames = htmlElement.querySelectorAll('.post_name');

            var dataArr = []; // 게시글리스트 데이터 생성
            for (var i = 0; i < postSubjects.length; i++) {
                var listItem = {};

                var subjectMatch = postSubjects[i].innerHTML.match(/<a.*?>([\s\S]*?)<\/a>/),
                    repCountMatch = postSubjects[i].innerHTML.match(/<span>\[(.*?)\]/),
                    nickname = postNicknames[i].innerHTML.replace('/cs2', 'http://www.clien.net/cs2');

                if (subjectMatch) {
                    listItem.subject = subjectMatch[1];
                    listItem.nickname = nickname;
                } else {
                    listItem.subject = '<span style="color: #999;">차단 또는 삭제된 글입니다.</span>';
                    listItem.nickname = '<span style="color: #999;">--</span>';
                }

                if (repCountMatch) {
                    listItem.repCount = repCountMatch[1];
                } else {
                    listItem.repCount = '';
                }

                dataArr.push(listItem);
            }
            var listViewData = new WinJS.Binding.List(dataArr);


            var listViewHost = document.getElementById('listView-posts');
            postListView = new WinJS.UI.ListView(listViewHost, {
                itemDataSource: listViewData.dataSource,
                itemTemplate: document.getElementById('postList-template'),
                layout: { type: WinJS.UI.ListLayout }
            });

            if (listener.remove.viewPost) { // 글보기 리스너 갱신
                listener.remove.viewPost();
            }
            listener.addRemovable('viewPost', postListView,'iteminvoked', this.handler_viewPost.bind(this));

            if (sess['currentScrollPos']) { // 스크롤위치 복구
                postListView.scrollPosition = sess['currentScrollPos'];
                delete sess['currentScrollPos'];
            }

            // 로딩 끝
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
                WinJS.Navigation.navigate('/pages/post_list/post_list.html');
            }
        },

        /* 함수 선언, 게시판 선택기의 특정 게시판만 체크 표시 */
        /* 부모객체의 _boardSelectorCmds 변수 필요            */
        /* boardId : String, 체크 표시할 게시판의 ID          */
        dispCheckMark: function (boardId) {
            for (var i = 0; i < boardSelectorCmds.length; i++) {
                var cmd = boardSelectorCmds[i].winControl;
                if (cmd.id === boardId) {
                    cmd.selected = true;
                } else {
                    cmd.selected = false;
                }
            }
        },

        /* 핸들러, 다음 페이지로 */
        handler_toNextPage: function (evtInf) {
            sess['currentPageNum'] += 1;
            this.showPostList(sess['currentBoardId'], sess['currentPageNum']);
        },

        /* 핸들러, 이전 페이지로 */
        handler_toPrevPage: function (evtInf) {
            sess['currentPageNum'] -= 1;
            this.showPostList(sess['currentBoardId'], sess['currentPageNum']);
        },

        /* 핸들러, 글 제목 클릭시 글 보기 */
        handler_viewPost: function (evtInf) {
            sess['currentScrollPos'] = postListView.scrollPosition;
            var i = evtInf.detail.itemIndex;
            var postId = postSubjects[i].innerHTML.match(/wr_id=(\d+)/);
            if (postId) {
                sess['currentPostId'] = postId[1];
                WinJS.UI.Animation.fadeOut(currentPageDisp).then(function () {
                    WinJS.Navigation.navigate('/pages/view_post/view_post.html');
                });
            }
                // else: 게시글 ID 로드 실패
                // TODO: 오류처리
        }
    });
})();

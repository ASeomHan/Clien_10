(function () {
    "use strict";

    /*
        1.1.0
        - Windows 10 데스크탑용 첫 릴리즈

        1.1.1
        - 태블릿 모드에서 뒤로가기가 안되는 현상 수정
        - 기타 사소한 부분 수정

        1.1.2
        - 아이콘 디자인 수정
        - 앱 언어와 관련된 오류 수정
        - WinJS 라이브러리 업데이트

        1.1.3
        - 영어 환경에서 앱이 크래시되는 현상 수정
            - 한글 포함된 정규표현식 제거
        - 게시판 제목이 제대로 표현되지 않는 문제 수정
            - 게시판 제목 z-index 수정
        - 안정적인 작동을 위한 코드 수정
            - 웹 연결은 성공했으나 필요한 요소가 없는 경우를 예외처리
    */

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var titleBar = Windows.UI.ViewManagement.ApplicationView.getForCurrentView().titleBar,
        lightBlue = { a: 100, r: 220, g: 225, b: 240 },
        dimBlue = { a: 100, r: 198, g: 203, b: 216 },
        darkBlue = { a: 100, r: 176, g: 180, b: 192 };

    titleBar.backgroundColor = lightBlue;
    titleBar.inactiveBackgroundColor = lightBlue;
    titleBar.buttonBackgroundColor = lightBlue;
    titleBar.buttonInactiveBackgroundColor = lightBlue;
    titleBar.buttonHoverBackgroundColor = dimBlue;
    titleBar.buttonPressedBackgroundColor = darkBlue;
    titleBar.buttonForegroundColor = Windows.UI.Colors.black;
    titleBar.buttonInactiveForegroundColor = Windows.UI.Colors.black;
    titleBar.buttonHoverForegroundColor = Windows.UI.Colors.black;
    titleBar.buttonPressedForegroundColor = Windows.UI.Colors.black;

    // 앱 활성화됨
    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState === activation.ApplicationExecutionState.terminated) {
                // 이 응용 프로그램은 일시 중단된 후 종료되었습니다.
                if (app.sessionState['history']) {
                    WinJS.Navigation.history = app.sessionState['history'];
                    // 종료전 열려있던 페이지 다시 여는게 기록에 안남도록 ↓
                    WinJS.Navigation.history.current.initialPlaceholder = true;
                }
            }

            if (app.sessionState['currentPostId']) {
                WinJS.Navigation.navigate('/pages/view_post/view_post.html');
            } else {
                // 이 함수가 자체적으로 페이지 이동시키지 못하고,
                // WinJS.Navigation.onnavigating 이벤트 핸들러가 필요
                WinJS.Navigation.navigate('/pages/post_list/post_list.html');
            }
        }
    };

    // 페이지 이동시 발생하는 이벤트
    // https://msdn.microsoft.com/ko-kr/library/windows/apps/dn376409.aspx
    WinJS.Navigation.onnavigating = function (evtInf) {

        var pageRenderHost = document.getElementById('pageRenderHost');
        var mainSection = document.getElementById('section_main'); // 애니메이션 재생될 요소
        var newUri = evtInf.detail.location; // 새로 렌더링될 페이지의 URI
        var navState = evtInf.detail.state;
        WinJS.UI.Animation.exitPage(mainSection).then(function () {
            listener.removeAll();
            WinJS.Utilities.empty(pageRenderHost); // 기존에 렌더링된 페이지 없앰
            WinJS.UI.Pages.render(newUri, pageRenderHost, navState).then(function () {
                WinJS.UI.Animation.enterPage(mainSection);
                app.sessionState['history'] = WinJS.Navigation.history;
            });
        });
    };

    // 페이지 이동후 발생하는 이벤트
    WinJS.Navigation.onnavigated = function (evt) {
        // 뒤로가기가 가능한 경우에만 백버튼 보이기
        if (WinJS.Navigation.canGoBack) {
            sysNavMgr.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.visible;
        } else {
            sysNavMgr.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
        }
    };

    // 시스템 UI 뒤로가기 이벤트 설정
    var sysNavMgr = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
    sysNavMgr.onbackrequested = function (evt) {
        WinJS.Navigation.back();
        evt.handled = true;
    };

	app.start();
})();

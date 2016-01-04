(function () {
    "use strict";

    WinJS.Namespace.define('listener', {

        addRemovable: function (id, target, eventType, handler) {
            if (this.remove[id]) {
                debugger; // id 중복
            } else {
                target.addEventListener(eventType, handler);
                // 리스너 삭제함수 생성
                this.remove[id] = function () {
                    target.removeEventListener(eventType, handler);
                    delete this[id];
                };
            }
        },

        removeAll: function () {
            for (var id in this.remove) {
                this.remove[id]();
            }
        },

        remove: {}
    });
})();
$(document).ready(function () {
    const accessKey = localStorage.getItem('uploadAccessKey');
    if (!accessKey) {
        showAccessKeyModal();
    } else {
        verifyAccessKey(accessKey);
    }

    $('#access-key-form').on('submit', function (e) {
        e.preventDefault();
        const enteredKey = $('#access-key').val();
        verifyAccessKey(enteredKey);
    });

    $('#access-key-modal').on('hide.bs.modal', function (e) {
        if (!localStorage.getItem('uploadAccessKey')) {
            window.location.href = '/';
        }
    });
});
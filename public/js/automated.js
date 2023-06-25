$(document).ready(function () {

    function initSpinners() {
        $('.spinner-volume').spinner(electronConfig.dataTypes['volume']);
        $('.spinner-frequency').spinner(electronConfig.dataTypes['frequency']);
    }

    function initValidation() {
        document.getElementById('automated-session-form').addEventListener('submit', function (event) {
            event.preventDefault();

            const minFrequencyInput = document.getElementsByName('min-frequency')[0];
            const maxFrequencyInput = document.getElementsByName('max-frequency')[0];
            const startFrequencyInput = document.getElementsByName('start-frequency')[0];
            const startVolumeInput = document.getElementsByName('start-volume')[0];

            const minFrequency = parseInt(minFrequencyInput.value);
            const maxFrequency = parseInt(maxFrequencyInput.value);
            const startFrequency = parseInt(startFrequencyInput.value);
            const startVolume = parseInt(startVolumeInput.value);

            let errorMsg = '';

            if (minFrequency < 100 || minFrequency > 3000) {
                errorMsg += 'Minimum frequency should be between 100 and 3000.\n';
            }

            if (maxFrequency < 100 || maxFrequency > 3000) {
                errorMsg += 'Maximum frequency should be between 100 and 3000.\n';
            }

            if (startFrequency < minFrequency || startFrequency > maxFrequency) {
                errorMsg += 'Starting frequency should be between the minimum and maximum frequencies.\n';
            }

            if (startVolume < 1 || startVolume > 90) {
                errorMsg += 'Starting volume should be between 1% and 90%.\n';
            }

            if (errorMsg) {
                alert(errorMsg);
            } else {
                event.target.submit();
            }
        });

    }

    initValidation();
    initSpinners();
    $('select').selectmenu();

});

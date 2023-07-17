$(document).ready(function () {
    const trafficLight = document.querySelector('.traffic-light');
    const buttons = trafficLight.querySelectorAll('button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(otherButton => {
                if (otherButton !== button) {
                    otherButton.classList.remove('active');
                }
            });
            button.classList.add('active');
            $(window).trigger('traffic-light');
        });
    });
});
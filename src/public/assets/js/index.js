const socket = io.connect('http://localhost');

socket.on('refresh', () => {
    window.location.reload();
});

// increase/decrease vol
const showmodal = (type) => {
    document.getElementById('volume-title').innerText = type + ' Volume';
    window.type = type.toLowerCase();
    document.getElementsByClassName('modal')[0].style.display = 'block';
};

const hidemodal = () => {
    document.getElementsByClassName('modal')[0].style.display = 'none';
};

document.getElementsByClassName('modal-background')[0].onclick = () => { 
    hidemodal();
}

const amount = document.getElementById('amount');
amount.oninput = () => { 
    document.getElementById('amountcurrent').innerText = `0 (${amount.value})`;
};

const speed = document.getElementById('speed');
speed.oninput = () => { 
    document.getElementById('speedcurrent').innerText = `0 (${speed.value})`;
};

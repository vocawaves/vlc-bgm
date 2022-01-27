const socket = io.connect('http://localhost');

const updating = document.getElementById('updating');
const submitbtn = document.getElementById('submitbtn');

const showmodal = (type) => {
    document.getElementById('volume-title').innerText = type + ' Volume';
    window.type = type.toLowerCase();
    document.getElementsByClassName('modal')[0].style.display = 'block';
};

const hidemodal = () => {
    document.getElementsByClassName('modal')[0].style.display = 'none';
    updating.innerText = '';
    submitbtn.disabled = false;
};

socket.on('refresh', (data) => {
    document.getElementsByClassName('subtitle')[0].innerText = `Current status: ${data.status} @ volume ${data.volume}%`;
    hidemodal();
});

socket.on('refreshstats', (data) => {
    document.getElementsByClassName('subtitle')[0].innerText = `Current status: ${data.status} @ volume ${data.volume}%`;
});

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

const submitmodal = () => {
    socket.emit('changevolume', window.type, amount.value, speed.value);
    updating.innerText = 'Updating...';
    submitbtn.disabled = true;
};

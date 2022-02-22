const socket = io.connect(window.location.href);

const updating = document.getElementById('updating');
const submitbtn = document.getElementById('submitbtn');
const modal = document.getElementsByClassName('modal')[0];
const statusElement = document.getElementsByClassName('subtitle')[0];
const songElement = document.getElementsByClassName('subtitle')[1];
const volumeslider = document.getElementById('volumeslider');

function showmodal(type) {
    document.getElementById('volume-title').innerText = type + ' Volume';
    window.type = type.toLowerCase();
    modal.style.display = 'block';
};

function hidemodal() {
    modal.style.display = 'none';
    updating.innerText = '';
    submitbtn.disabled = false;
};

socket.on('refresh', function(data) {
    statusElement.innerText = `Current status: ${data.status} @ volume ${data.volume}%`;
    songElement.innerText = `Current song: ${data.song}`;
    hidemodal();
});

socket.on('refreshstats', function(data) {
    statusElement.innerText = `Current status: ${data.status} @ volume ${data.volume}%`;
    songElement.innerText = `Current song: ${data.song}`;
});

document.getElementsByClassName('modal-background')[0].onclick = function() { 
    hidemodal();
}

const amount = document.getElementById('amount');
amount.oninput = function() { 
    document.getElementById('amountcurrent').innerText = `0 (${amount.value})`;
};

const speed = document.getElementById('speed');
speed.oninput = function() { 
    document.getElementById('speedcurrent').innerText = `0 (${speed.value})`;
};

function submitmodal() {
    socket.emit('changevolume', window.type, amount.value, speed.value);
    updating.innerText = 'Updating...';
    submitbtn.disabled = true;
};

volumeslider.onchange = function(e) { 
    socket.emit('changevolumeexact', e.target.value);
}

// errors
socket.on('connect', function() {
    document.getElementById('error').style.display = 'none';
});

socket.on('connect_error', function() {
    document.getElementById('error').style.display = 'block';
});

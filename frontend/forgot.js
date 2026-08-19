let userEmail = "";
let otpTimerInterval;
let resendTimerInterval;
let isSendingOTP = false;
let isOtpVerified = false;

// ================= START OTP VALIDITY TIMER =================
function startOtpTimer(durationInSeconds) {
    clearInterval(otpTimerInterval);

    let timeLeft = durationInSeconds;
    let timerText = document.getElementById("otpTimer");

    otpTimerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        timerText.innerText =
            `OTP valid for: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            timerText.innerText = "OTP expired. Please resend OTP.";
        }

        timeLeft--;
    }, 1000);
}

// ================= START RESEND TIMER =================
function startResendTimer(durationInSeconds) {
    clearInterval(resendTimerInterval);

    let timeLeft = durationInSeconds;
    let resendBtn = document.getElementById("resendBtn");

    resendBtn.disabled = true;
    resendBtn.innerText = `Resend OTP in ${timeLeft}s`;

    resendTimerInterval = setInterval(() => {
        timeLeft--;

        resendBtn.innerText = `Resend OTP in ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(resendTimerInterval);
            resendBtn.disabled = false;
            resendBtn.innerText = "Resend OTP";
        }
    }, 1000);
}

// ================= SEND OTP =================
async function sendOTP() {
    if (isSendingOTP) {
        return;
    }

    let sendBtn = document.getElementById("sendOtpBtn");
    let resendBtn = document.getElementById("resendBtn");

    userEmail = document.getElementById("email").value.trim();

    if (!userEmail) {
        alert("Please enter your email");
        return;
    }

    try {
        isSendingOTP = true;

        sendBtn.disabled = true;
        sendBtn.innerText = "Sending...";

        if (resendBtn) {
            resendBtn.disabled = true;
        }

        let res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: userEmail })
        });

        let data = await res.json();

        alert(data.message || data.error || "Something went wrong");

        if (res.ok) {
            startOtpTimer(10 * 60);
            startResendTimer(60);

            sendBtn.innerText = "OTP Sent";
        } else {
            sendBtn.disabled = false;
            sendBtn.innerText = "Send OTP";
        }

    } catch (err) {
        console.log(err);
        alert("Server error");

        sendBtn.disabled = false;
        sendBtn.innerText = "Send OTP";

    } finally {
        isSendingOTP = false;
    }
}

// ================= RESEND OTP =================
async function resendOTP() {
    if (isSendingOTP) {
        return;
    }

    await sendOTP();
}

// ================= VERIFY OTP =================
async function verifyOTP() {
    let otp = document.getElementById("otp").value.trim();

    if (!userEmail) {
        alert("Please send OTP first");
        return;
    }

    if (!otp) {
        alert("Please enter OTP");
        return;
    }

    try {
        let res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: userEmail, otp })
        });

        let data = await res.json();

        alert(data.message || data.error || "Something went wrong");

        if (res.ok) {
            isOtpVerified = true;

            let resetBtn = document.getElementById("resetBtn");
            resetBtn.disabled = false;
        }

    } catch (err) {
        console.log(err);
        alert("Server error");
    }
}

// ================= RESET PASSWORD =================
async function resetPassword() {
    let otp = document.getElementById("otp").value.trim();
    let newPassword = document.getElementById("newPassword").value.trim();

    if (!isOtpVerified) {
        alert("Please verify OTP first");
        return;
    }

    if (!userEmail) {
        alert("Please send OTP first");
        return;
    }

    if (!otp) {
        alert("Please enter OTP");
        return;
    }

    if (!newPassword) {
        alert("Please enter new password");
        return;
    }

    let passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordPattern.test(newPassword)) {
        alert("Password must be at least 8 characters, include one capital letter and one special character");
        return;
    }

    try {
        let res = await fetch(`${API_BASE_URL}/api/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: userEmail,
                otp,
                newPassword
            })
        });

        let data = await res.json();

        alert(data.message || data.error || "Something went wrong");

        if (res.ok) {
            clearInterval(otpTimerInterval);
            clearInterval(resendTimerInterval);
            window.location.href = "login.html";
        }

    } catch (err) {
        console.log(err);
        alert("Server error");
    }
}
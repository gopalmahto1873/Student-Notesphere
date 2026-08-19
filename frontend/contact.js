document.getElementById("contactForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email || !message) {
        alert("Please fill all fields");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/contact/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                message
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || data.error || "Feedback send failed");
            return;
        }

        alert("Feedback sent successfully");
        document.getElementById("contactForm").reset();

    } catch (err) {
        console.log(err);
        alert("Server error. Please try again later.");
    }
});
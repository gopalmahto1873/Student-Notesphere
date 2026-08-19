// ================= USER + TOKEN =================
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("loggedInUser"));

// ================= CHECK LOGIN =================

if (!token || !user) {
    alert("Please login first");
    window.location.href = "login.html";
}

// ================= COMPLETE PROFILE =================

document.getElementById("completeProfileForm")
.addEventListener("submit", async function(e)
{
    e.preventDefault();

    try {

        const dob =document.getElementById("dob").value;
        const department =document.getElementById("department").value;
        const session =document.getElementById("session").value;
        const semester =document.getElementById("semester").value;
        const studentType =document.getElementById("studentType").value;
        
        const res = await fetch(`${API_BASE_URL}/api/complete-profile`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },

                body: JSON.stringify({
                    dob,
                    department,
                    session,
                    semester,
                    studentType
                })
            }
        );

        const data = await res.json();

        if (res.ok) {

            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(data.user)
            );

            alert(
                "Profile completed successfully"
            );

            window.location.href = "index.html";

        } else {

            alert(
                data.message ||
                data.error ||
                "Failed to complete profile"
            );
        }

    } catch (err) {

        console.log(err);

        alert("Server error");
    }
});
// ================= CHECK LOGIN =================
document.addEventListener("DOMContentLoaded", function () {

    let user = JSON.parse(localStorage.getItem("loggedInUser"));
    let loginLink = document.getElementById("loginLink");
    let profileMenu = document.getElementById("profileMenu");
    let navUserName = document.getElementById("navUserName");

    // If logged in
    if (user && user.email) {

        // Hide login button
        if (loginLink) {
            loginLink.style.display = "none";
        }

        // Show profile menu
        if (profileMenu) {
            profileMenu.style.display = "flex";
        }

        // Show user name
        if (navUserName)
            {
            let hour = new Date().getHours();
            let greeting = "Hi";

            if (hour < 12) {
                greeting = "Good Morning";
            } else if (hour < 17) {
                greeting = "Good Afternoon";
            } else {
                greeting = "Good Evening";
            }

            navUserName.innerText =
                `${greeting}, ${commonUser.firstName || "User"}`;
        }
    }
});


// ================= LOGOUT =================
function logout() 
{
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    window.location.href = "login.html";
}


        // Filter Notes by Course & Semester
        function filterByCourse(course, sem){

            // Store selected data
            localStorage.setItem("selectedCourse", course);
            localStorage.setItem("selectedSem", sem);

            // Redirect to notes page
            window.location.href = "notes.html";
        }

async function generateCustomId(Model, prefix) {

    // Last created document find
    const lastDoc = await Model.findOne({
        customId: { $regex: `^${prefix}` }
    }).sort({ createdAt: -1 });

    let nextNumber = 1;

    // If previous ID exists
    if (lastDoc && lastDoc.customId) {

        // Example:
        // SNUSER005 -> 5
        const lastNumber = parseInt(
            lastDoc.customId.replace(prefix, "")
        );

        nextNumber = lastNumber + 1;
    }

    // Final:
    // SNUSER001
    // SNUSER002
    return (
        prefix +
        String(nextNumber).padStart(3, "0")
    );
}

module.exports = generateCustomId;
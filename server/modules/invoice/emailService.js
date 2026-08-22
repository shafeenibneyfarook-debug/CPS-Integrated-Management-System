const EmailLog = require("./emailLog.model");

/**
 * Dispatch an email notification and log the outcome in EmailLog DB table
 */
exports.sendNotificationEmail = async ({ recipient, subject, emailType, referenceId = "", referenceModel = "", bodyText = "", userId = null, forceFail = false }) => {
    try {
        if (!recipient) throw new Error("Recipient email address is missing");

        // Simulate or perform email dispatch
        let status = "Success";
        let errorMessage = "";

        if (forceFail || recipient.endsWith("@fail.com")) {
            status = "Failed";
            errorMessage = "SMTP transport error: Recipient domain unreachable or invalid mailbox credentials.";
        }

        const logEntry = await EmailLog.create({
            recipient,
            subject,
            emailType,
            referenceId,
            referenceModel,
            status,
            errorMessage,
            attempts: 1,
            sentBy: userId
        });

        return logEntry;
    } catch (err) {
        return await EmailLog.create({
            recipient: recipient || "unknown@system.local",
            subject: subject || "System Notification",
            emailType: emailType || "Custom Alert",
            referenceId,
            referenceModel,
            status: "Failed",
            errorMessage: err.message,
            attempts: 1,
            sentBy: userId
        });
    }
};

/**
 * Retry a failed email log manually
 */
exports.retryEmail = async (emailLogId) => {
    const log = await EmailLog.findById(emailLogId);
    if (!log) throw new Error("Email log record not found");

    log.attempts += 1;
    // Simulate successful retry unless forced failure
    if (log.recipient.endsWith("@fail.com")) {
        log.status = "Failed";
        log.errorMessage = `Retry attempt #${log.attempts} failed: Mail server offline.`;
    } else {
        log.status = "Success";
        log.errorMessage = "";
    }

    await log.save();
    return log;
};


export async function uploadAttachment(noteId, file) {
    const { uploadUrl, s3Key } = await requestPresignedUrl(noteId, file);

    await uploadFileToS3(uploadUrl, file);
    
    const savedAttachment = await confirmAttachment(noteId, s3Key, file);

    return savedAttachment;
}

export async function fetchAttachments(noteId) {
    const response = await fetch(`/notes/${noteId}/attachments`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch note attachments: ${response.status}`);
    }

    return await response.json();
}

async function requestPresignedUrl(noteId, file) {
    const response = await fetch(`/notes/${noteId}/attachments/presign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size })
    });

    if (!response.ok) {
        throw new Error(`Failed to request presigned URL: ${response.status}`);
    }

    return await response.json();
}

async function uploadFileToS3(uploadUrl, file) {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file to S3: ${response.status}`);
    }
}

async function confirmAttachment(noteId, s3Key, file) {
    const response = await fetch(`/notes/${noteId}/attachments?s3Key=${encodeURIComponent(s3Key)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size })
    });

    if (!response.ok) {
        throw new Error(`Failed to confirm attachment: ${response.status}`)
    }

    return await response.json();
}

export async function deleteAttachment(noteId, attachmentId) {
    const response = await fetch(`/notes/${noteId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to delete attachment: ${response.status}`);
    }
}
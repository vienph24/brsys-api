const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const axiosInstance = axios.create({
    baseURL: `http://localhost:${process.env.PORT || 8000}/`,
    headers: {
        'x-api-key':
            process.env.API_KEY || '3954a858-a4c5-476b-bd37-15a460f06e12',
        'x-consumer-id':
            process.env.CID || 'f5a7065f-8406-430d-8737-db13019790d3',
    },
});

const getApi = {
    uploadUrl: '/upload-url',
    records: '/records',
};

function hashSha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

async function uploadFile() {
    // Get upload URL
    const { data: getUploadUrlResponse } = await axiosInstance.get(
        getApi.uploadUrl,
    );
    const uploadUrl = getUploadUrlResponse.uploadUrl;
    const token = getUploadUrlResponse.token;

    // Upload file to B2
    const filePath = process.argv[3];
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const headers = {
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Sha1': hashSha1(fileData),
        'Content-Type': 'b2/x-auto',
        Authorization: token,
    };

    let fileId;
    let sha1;
    try {
        const { data: b2 } = await axios.post(uploadUrl, fileData, {
            headers,
        });
        fileId = b2.fileId;
        sha1 = b2.contentSha1;
    } catch (error) {
        console.error(error);
        throw new Error(JSON.stringify(error));
    }

    // Record file request to server
    const { data } = await axiosInstance.post(getApi.records, {
        fileId,
        sha1,
    });

    console.log(data);
}

async function getFile() {
    const fileId = process.argv[3];
    const { data } = await axiosInstance.get(`${getApi.records}/${fileId}`);
    console.log({ data });
}

async function main() {
    const func = process.argv[2];

    if (func === 'upload_file') {
        await uploadFile();
        return;
    }

    if (func === 'get_file') {
        await getFile();
        return;
    }

    console.error('ERROR::Invalid method');
}

main();

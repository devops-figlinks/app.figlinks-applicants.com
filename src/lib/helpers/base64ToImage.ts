export const base64ToFile = (base64String: string, mimeType = null) => {
    let base64Data;
    let detectedMimeType = 'image/png';

    if (base64String.includes(',')) {
        const arr = base64String.split(',');
        const match = arr[0].match(/:(.*?);/);

        if (match) {
            detectedMimeType = match[1];
            base64Data = arr[1];
        } else {

            base64Data = arr[1];
        }
    } else {

        base64Data = base64String;
    }

    const finalMimeType = mimeType || detectedMimeType;

    const fileName = `image${Date.now()}.png`;

    const byteCharacters = atob(base64Data);
    const byteLength = byteCharacters.length;
    const byteArray = new Uint8Array(byteLength);

    for (let i = 0; i < byteLength; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
    }

    return new File([byteArray], fileName, { type: finalMimeType });
}
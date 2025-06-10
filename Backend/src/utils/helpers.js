export const stripHtmlTags = (str) => {
    const regex = /(<([^>]+)>)/gi;
    return str.replace(regex, '');
}
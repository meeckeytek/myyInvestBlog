class HttpError extends Error{
    constructor(message: any, errorCode: any){
        super(message);
        this.code = errorCode;
    }
}
export default HttpError;
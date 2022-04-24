/** Class that contains generic functions and utilities. */
class TWODJSUtils {
    /** Returns true if the given value is undefined or not. */
    static is_undefined(value){
        return undefined == value;
    }

    /** Returns true if the given value is null or not. */
    static is_null(value) {
        return null == value;
    }

    /** Returns true if the given value is of the specified type. */
    static value_get_type(value) {
        return typeof value;
    }

    /** Delay the execution of code for a specified duration (in milliseconds). */
    static sleep(duration) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, duration);
        });
    }
}
export default TWODJSUtils;
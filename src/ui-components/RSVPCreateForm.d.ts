/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type RSVPCreateFormInputValues = {
    eventId?: string;
    userId?: string;
    createdAt?: string;
};
export declare type RSVPCreateFormValidationValues = {
    eventId?: ValidationFunction<string>;
    userId?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type RSVPCreateFormOverridesProps = {
    RSVPCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventId?: PrimitiveOverrideProps<TextFieldProps>;
    userId?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type RSVPCreateFormProps = React.PropsWithChildren<{
    overrides?: RSVPCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: RSVPCreateFormInputValues) => RSVPCreateFormInputValues;
    onSuccess?: (fields: RSVPCreateFormInputValues) => void;
    onError?: (fields: RSVPCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: RSVPCreateFormInputValues) => RSVPCreateFormInputValues;
    onValidate?: RSVPCreateFormValidationValues;
} & React.CSSProperties>;
export default function RSVPCreateForm(props: RSVPCreateFormProps): React.ReactElement;

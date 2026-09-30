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
export declare type RSVPUpdateFormInputValues = {
    eventId?: string;
    userId?: string;
    createdAt?: string;
};
export declare type RSVPUpdateFormValidationValues = {
    eventId?: ValidationFunction<string>;
    userId?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type RSVPUpdateFormOverridesProps = {
    RSVPUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventId?: PrimitiveOverrideProps<TextFieldProps>;
    userId?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type RSVPUpdateFormProps = React.PropsWithChildren<{
    overrides?: RSVPUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    rSVP?: any;
    onSubmit?: (fields: RSVPUpdateFormInputValues) => RSVPUpdateFormInputValues;
    onSuccess?: (fields: RSVPUpdateFormInputValues) => void;
    onError?: (fields: RSVPUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: RSVPUpdateFormInputValues) => RSVPUpdateFormInputValues;
    onValidate?: RSVPUpdateFormValidationValues;
} & React.CSSProperties>;
export default function RSVPUpdateForm(props: RSVPUpdateFormProps): React.ReactElement;

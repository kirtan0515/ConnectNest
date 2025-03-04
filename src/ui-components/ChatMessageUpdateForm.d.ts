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
export declare type ChatMessageUpdateFormInputValues = {
    sender?: string;
    content?: string;
    timestamp?: string;
    chatroomID?: string;
};
export declare type ChatMessageUpdateFormValidationValues = {
    sender?: ValidationFunction<string>;
    content?: ValidationFunction<string>;
    timestamp?: ValidationFunction<string>;
    chatroomID?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ChatMessageUpdateFormOverridesProps = {
    ChatMessageUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    sender?: PrimitiveOverrideProps<TextFieldProps>;
    content?: PrimitiveOverrideProps<TextFieldProps>;
    timestamp?: PrimitiveOverrideProps<TextFieldProps>;
    chatroomID?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ChatMessageUpdateFormProps = React.PropsWithChildren<{
    overrides?: ChatMessageUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    chatMessage?: any;
    onSubmit?: (fields: ChatMessageUpdateFormInputValues) => ChatMessageUpdateFormInputValues;
    onSuccess?: (fields: ChatMessageUpdateFormInputValues) => void;
    onError?: (fields: ChatMessageUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ChatMessageUpdateFormInputValues) => ChatMessageUpdateFormInputValues;
    onValidate?: ChatMessageUpdateFormValidationValues;
} & React.CSSProperties>;
export default function ChatMessageUpdateForm(props: ChatMessageUpdateFormProps): React.ReactElement;

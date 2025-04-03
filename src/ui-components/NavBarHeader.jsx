/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { getOverrideProps } from "./utils";
import { Flex, Icon, Image, Text, View } from "@aws-amplify/ui-react";
import MyIcon from "./MyIcon";
export default function NavBarHeader(props) {
  const { overrides, ...rest } = props;
  return (
    <Flex
      gap="40px"
      direction="row"
      width="1440px"
      height="93px"
      justifyContent="center"
      alignItems="center"
      position="relative"
      boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
      padding="24px 32px 24px 32px"
      backgroundColor="rgba(255,255,255,1)"
      {...getOverrideProps(overrides, "NavBarHeader")}
      {...rest}
    >
      <View
        width="227px"
        height="28px"
        display="block"
        gap="unset"
        alignItems="unset"
        justifyContent="unset"
        shrink="0"
        position="relative"
        padding="0px 0px 0px 0px"
        {...getOverrideProps(overrides, "Frame 437")}
      >
        <Image
          width="227px"
          height="28px"
          display="block"
          gap="unset"
          alignItems="unset"
          justifyContent="unset"
          position="absolute"
          top="0px"
          left="0px"
          padding="0px 0px 0px 0px"
          objectFit="cover"
          {...getOverrideProps(overrides, "connectnest-logo")}
        ></Image>
      </View>
      <Flex
        gap="40px"
        direction="row"
        width="unset"
        height="24px"
        justifyContent="flex-start"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        padding="0px 0px 0px 0px"
        {...getOverrideProps(overrides, "Navigation")}
      >
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          direction="column"
          justifyContent="unset"
          width="unset"
          height="unset"
          gap="unset"
          alignItems="unset"
          shrink="0"
          position="relative"
          padding="0px 0px 0px 0px"
          whiteSpace="pre-wrap"
          children="Home"
          {...getOverrideProps(overrides, "Home")}
        ></Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          direction="column"
          justifyContent="unset"
          width="unset"
          height="unset"
          gap="unset"
          alignItems="unset"
          shrink="0"
          position="relative"
          padding="0px 0px 0px 0px"
          whiteSpace="pre-wrap"
          children="Groups"
          {...getOverrideProps(overrides, "Groups")}
        ></Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          direction="column"
          justifyContent="unset"
          width="unset"
          height="unset"
          gap="unset"
          alignItems="unset"
          shrink="0"
          position="relative"
          padding="0px 0px 0px 0px"
          whiteSpace="pre-wrap"
          children="Events"
          {...getOverrideProps(overrides, "Events")}
        ></Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          direction="column"
          justifyContent="unset"
          width="unset"
          height="unset"
          gap="unset"
          alignItems="unset"
          shrink="0"
          position="relative"
          padding="0px 0px 0px 0px"
          whiteSpace="pre-wrap"
          children="Files"
          {...getOverrideProps(overrides, "Files")}
        ></Text>
      </Flex>
      <View
        width="606px"
        height="45px"
        display="block"
        gap="unset"
        alignItems="unset"
        justifyContent="unset"
        overflow="hidden"
        shrink="0"
        position="relative"
        border="1px SOLID rgba(224,224,224,1)"
        borderRadius="10px"
        padding="0px 0px 0px 0px"
        backgroundColor="rgba(240,240,240,1)"
        {...getOverrideProps(overrides, "SearchbarContainer")}
      >
        <Icon
          width="28.93px"
          height="28.93px"
          viewBox={{
            minX: 0,
            minY: 0,
            width: 28.93000030517578,
            height: 28.928571701049805,
          }}
          paths={[
            {
              d: "M19.9938 18.5786C19.6032 18.1881 18.9701 18.1881 18.5795 18.5786C18.189 18.9692 18.189 19.6023 18.5796 19.9928L19.9938 18.5786ZM28.2229 29.6357C28.6134 30.0262 29.2466 30.0262 29.6371 29.6357C30.0276 29.2451 30.0276 28.612 29.6371 28.2214L28.2229 29.6357ZM11.2506 22.5L11.2506 21.5L11.2506 22.5ZM0 11.25L-1 11.25L0 11.25ZM22.5011 11.25L21.5011 11.25L22.5011 11.25ZM18.5796 19.9928L28.2229 29.6357L29.6371 28.2214L19.9938 18.5786L18.5796 19.9928ZM11.2506 21.5C9.90443 21.5 8.57148 21.2349 7.32782 20.7198L6.56249 22.5675C8.04879 23.1831 9.6418 23.5 11.2506 23.5L11.2506 21.5ZM7.32782 20.7198C6.08416 20.2046 4.95415 19.4496 4.0023 18.4978L2.58812 19.9121C3.72569 21.0496 5.07618 21.9519 6.56249 22.5675L7.32782 20.7198ZM4.0023 18.4978C3.05045 17.546 2.2954 16.4161 1.78027 15.1725L-0.0674756 15.9379C0.548177 17.4241 1.45055 18.7746 2.58812 19.9121L4.0023 18.4978ZM1.78027 15.1725C1.26514 13.9289 1 12.596 1 11.25L-1 11.25C-1 12.8587 -0.683128 14.4516 -0.0674756 15.9379L1.78027 15.1725ZM1 11.25C1 9.90396 1.26514 8.5711 1.78027 7.32751L-0.0674756 6.56211C-0.683128 8.04835 -1 9.6413 -1 11.25L1 11.25ZM1.78027 7.32751C2.2954 6.08393 3.05045 4.95398 4.0023 4.00217L2.58812 2.58792C1.45055 3.72544 0.548176 5.07587 -0.0674756 6.56211L1.78027 7.32751ZM4.0023 4.00217C4.95415 3.05037 6.08416 2.29536 7.32782 1.78024L6.56249 -0.0675308C5.07619 0.548085 3.72569 1.45041 2.58812 2.58792L4.0023 4.00217ZM7.32782 1.78024C8.57148 1.26513 9.90443 1 11.2506 1L11.2506 -1C9.6418 -1 8.04879 -0.683147 6.56249 -0.0675308L7.32782 1.78024ZM11.2506 1C13.9692 1 16.5765 2.07992 18.4988 4.00217L19.913 2.58792C17.6156 0.290609 14.4996 -1 11.2506 -1L11.2506 1ZM18.4988 4.00217C20.4212 5.92442 21.5011 8.53155 21.5011 11.25L23.5011 11.25C23.5011 8.00108 22.2104 4.88524 19.913 2.58792L18.4988 4.00217ZM21.5011 11.25C21.5011 13.9685 20.4212 16.5756 18.4988 18.4978L19.913 19.9121C22.2104 17.6148 23.5011 14.4989 23.5011 11.25L21.5011 11.25ZM18.4988 18.4978C16.5765 20.4201 13.9692 21.5 11.2506 21.5L11.2506 23.5C14.4996 23.5 17.6156 22.2094 19.913 19.9121L18.4988 18.4978Z",
              stroke: "rgba(136,136,136,1)",
              fillRule: "nonzero",
              strokeLinejoin: "round",
              strokeWidth: 2,
            },
          ]}
          display="block"
          gap="unset"
          alignItems="unset"
          justifyContent="unset"
          position="absolute"
          top="19.64%"
          bottom="16.07%"
          left="93.23%"
          right="1.99%"
          {...getOverrideProps(overrides, "Vector")}
        ></Icon>
        <Text
          fontFamily="Inter"
          fontSize="20px"
          fontWeight="400"
          color="rgba(136,136,136,1)"
          lineHeight="40px"
          textAlign="left"
          display="block"
          direction="column"
          justifyContent="unset"
          width="80px"
          height="45px"
          gap="unset"
          alignItems="unset"
          position="absolute"
          top="1px"
          left="485px"
          padding="0px 0px 0px 0px"
          whiteSpace="pre-wrap"
          children="Search"
          {...getOverrideProps(overrides, "Search Text")}
        ></Text>
      </View>
      <Flex
        gap="32px"
        direction="row"
        width="117px"
        height="unset"
        justifyContent="flex-end"
        alignItems="center"
        shrink="0"
        position="relative"
        padding="0px 0px 0px 0px"
        {...getOverrideProps(overrides, "Container")}
      >
        <MyIcon
          width="24px"
          height="24px"
          display="block"
          gap="unset"
          alignItems="unset"
          justifyContent="unset"
          overflow="hidden"
          shrink="0"
          position="relative"
          padding="0px 0px 0px 0px"
          type="notification"
          {...getOverrideProps(overrides, "MyIcon")}
        ></MyIcon>
        <Image
          width="45px"
          height="45px"
          display="block"
          gap="unset"
          alignItems="unset"
          justifyContent="unset"
          shrink="0"
          position="relative"
          borderRadius="160px"
          padding="0px 0px 0px 0px"
          objectFit="cover"
          {...getOverrideProps(overrides, "image")}
        ></Image>
      </Flex>
    </Flex>
  );
}

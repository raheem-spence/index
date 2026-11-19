package com.raheemspence.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadResponse {

    private String uploadUrl; // temporary AWS S3 signed URL (valid for ~10 min)
    private String s3Key;     // the unique path in my bucket
}

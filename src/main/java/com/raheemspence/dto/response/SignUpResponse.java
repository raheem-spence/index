package com.raheemspence.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignUpResponse {

    private Long userId;
    private String status;
    private String message;
}

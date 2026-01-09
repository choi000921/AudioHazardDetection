package com.example.Alertory.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// ADDED: Web configuration for interceptors
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    
    private final StatusGuardInterceptor statusGuardInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // ADDED: Status guard interceptor 등록
        registry.addInterceptor(statusGuardInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**", "/api/me");
    }
}
package com.openclassrooms.mddapi.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info().title("MDD API").version("v1"))
                .components(new Components()
                        // Auth par header Authorization: Bearer <JWT>
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT"))
                        // (Optionnel) Auth par cookie si tu utilises un JWT en cookie HttpOnly
                        .addSecuritySchemes("cookieAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)
                                        .name("jwt")) // <-- mets ici le vrai nom de TON cookie
                )
                // Appliquer par défaut (tu peux aussi le mettre par contrôleur/endpoint)
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}

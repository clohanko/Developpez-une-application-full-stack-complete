package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.dto.CommentDto;
import com.openclassrooms.mddapi.dto.PostDto;
import com.openclassrooms.mddapi.payload.request.CreateCommentRequest;
import com.openclassrooms.mddapi.payload.request.CreatePostRequest;
import com.openclassrooms.mddapi.service.PostService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostControllerTest {

    @Mock
    PostService service;

    @InjectMocks
    PostController controller;

    private Authentication auth(String name) {
        return new UsernamePasswordAuthenticationToken(name, "n/a");
    }

    @Test
    void create_callsService_andReturns200WithPostDto() {
        CreatePostRequest req = new CreatePostRequest(7L, "Titre", "Contenu");
        PostDto dto = new PostDto(
                1L, 7L, "Spring", "Titre", "Contenu",
                10L, "seb", Instant.now(), List.of()
        );
        when(service.create("seb@example.com", req)).thenReturn(dto);

        ResponseEntity<PostDto> resp = controller.create(req, auth("seb@example.com"));

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isSameAs(dto); // on renvoie exactement ce que le service retourne
        verify(service).create("seb@example.com", req);
    }

    @Test
    void getOne_callsService_andReturns200WithPostDto() {
        PostDto dto = new PostDto(
                2L, 7L, "Spring", "Hello", "World",
                10L, "seb", Instant.now(), List.of()
        );
        when(service.getOne(2L)).thenReturn(dto);

        ResponseEntity<PostDto> resp = controller.getOne(2L);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isSameAs(dto);
        verify(service).getOne(2L);
    }

    @Test
    void addComment_callsService_andReturns200WithCommentDto() {
        CreateCommentRequest req = new CreateCommentRequest("Coucou");
        CommentDto dto = new CommentDto(
                5L, 10L, "seb", "Coucou", Instant.now()
        );
        when(service.addComment("seb@example.com", 2L, req)).thenReturn(dto);

        ResponseEntity<CommentDto> resp = controller.addComment(2L, req, auth("seb@example.com"));

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isSameAs(dto);
        verify(service).addComment("seb@example.com", 2L, req);
    }
}

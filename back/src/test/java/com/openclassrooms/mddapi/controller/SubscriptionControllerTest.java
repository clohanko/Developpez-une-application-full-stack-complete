package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionControllerTest {

    @Mock
    SubscriptionService service;

    @InjectMocks
    SubscriptionController controller;

    private Authentication auth(String name) {
        return new UsernamePasswordAuthenticationToken(name, "n/a");
    }

    @Test
    void subscribe_callsService_andReturns200() {
        ResponseEntity<String> resp = controller.subscribe(7L, auth("seb@example.com"));

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isEqualTo("ok");
        verify(service).subscribe("seb@example.com", 7L);
    }

    @Test
    void unsubscribe_callsService_andReturns200() {
        ResponseEntity<String> resp = controller.unsubscribe(7L, auth("seb@example.com"));

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isEqualTo("ok");
        verify(service).unsubscribe("seb@example.com", 7L);
    }

    @Test
    void mySubscriptions_returnsIds_fromService() {
        when(service.listTopicIds("seb@example.com")).thenReturn(List.of(1L, 2L, 3L));

        ResponseEntity<List<Long>> resp = controller.mySubscriptions(auth("seb@example.com"));

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).containsExactly(1L, 2L, 3L);
        verify(service).listTopicIds("seb@example.com");
    }
}

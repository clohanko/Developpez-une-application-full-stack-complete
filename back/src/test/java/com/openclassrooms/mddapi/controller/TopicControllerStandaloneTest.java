package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.repository.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test standalone SANS contexte Spring.
 * Compatible avec TopicController(TopicRepository) ou constructeur par défaut.
 */
class TopicControllerStandaloneTest {

    private static final String LIST_ENDPOINT = "/api/topics"; // adapte si ton endpoint diffère

    private MockMvc mvc;
    private TopicRepository topicRepository;

    @BeforeEach
    void setUp() throws Exception {
        topicRepository = Mockito.mock(TopicRepository.class);

        // Instanciation robuste du contrôleur (avec ou sans argument) via réflexion
        TopicController controller;
        try {
            // Essaye constructeur avec TopicRepository
            Constructor<TopicController> c1 =
                    TopicController.class.getDeclaredConstructor(TopicRepository.class);
            c1.setAccessible(true);
            controller = c1.newInstance(topicRepository);
        } catch (NoSuchMethodException e) {
            // Sinon, prends le no-arg constructor et injecte le champ privé
            Constructor<TopicController> c0 =
                    TopicController.class.getDeclaredConstructor();
            c0.setAccessible(true);
            controller = c0.newInstance();

            Field f = TopicController.class.getDeclaredField("topicRepository");
            f.setAccessible(true);
            f.set(controller, topicRepository);
        }

        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void list_returns200_andJsonArray() throws Exception {
        Topic t1 = new Topic(); t1.setId(1L); t1.setName("Java");   t1.setSlug("java");
        Topic t2 = new Topic(); t2.setId(2L); t2.setName("Spring"); t2.setSlug("spring");

        Mockito.when(topicRepository.findAll()).thenReturn(List.of(t1, t2));

        mvc.perform(get(LIST_ENDPOINT).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)));
    }
}

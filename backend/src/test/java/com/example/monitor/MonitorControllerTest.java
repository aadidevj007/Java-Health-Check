package com.example.monitor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MonitorController.class)
class MonitorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthHistoryRepository historyRepository;

    @Test
    void statusReturnsUp() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("java-health-monitor"));
    }

    @Test
    void databaseReturnsReachableStatus() throws Exception {
        when(historyRepository.count()).thenReturn(3L);
        when(historyRepository.save(any(HealthHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(get("/api/diagnostics/database"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.recordCount").value(3));
    }
}

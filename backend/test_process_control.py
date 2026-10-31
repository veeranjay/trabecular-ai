import threading,unittest
from unittest.mock import patch
from process_control import MemoryGuard

class GuardTests(unittest.TestCase):
    def test_low_memory_stops_only_the_owned_process(self):
        class Process:
            stopped=False
            def poll(self):return -1 if self.stopped else None
        process=Process();stopped=threading.Event()
        def stop(owned):
            self.assertIs(owned,process);owned.stopped=True;stopped.set()
        with patch('process_control.available_memory_bytes',return_value=1),patch('process_control.stop_process_tree',side_effect=stop):
            guard=MemoryGuard(process,minimum=1024,interval=.01)
            self.assertTrue(stopped.wait(1));guard.close()
        self.assertTrue(guard.exhausted.is_set())
    def test_closing_the_guard_does_not_cancel_a_healthy_process(self):
        class Process:
            def poll(self):return None
        with patch('process_control.stop_process_tree') as stop:
            guard=MemoryGuard(Process(),interval=.01);guard.close()
        stop.assert_not_called();self.assertFalse(guard.exhausted.is_set())

if __name__=='__main__':unittest.main()

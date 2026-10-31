"""No credentials or cloud calls are needed to verify execution policy."""
import unittest
from unittest.mock import patch
from settings import require_cloud_execution


class CloudPolicyTests(unittest.TestCase):
    def policy(self, enabled=False, configured=True, budget=30):
        return {'cloud_enabled': enabled, 'modal': configured, 'cloud_budget_usd': budget}

    def test_credentials_do_not_enable_execution(self):
        with patch('settings.configuration', return_value=self.policy()):
            with self.assertRaisesRegex(ValueError, 'disabled'):
                require_cloud_execution()

    def test_missing_credentials_and_invalid_budgets_fail(self):
        for config in [self.policy(True, False), self.policy(True, True, 0), self.policy(True, True, 31)]:
            with self.subTest(config=config), patch('settings.configuration', return_value=config):
                with self.assertRaises(ValueError): require_cloud_execution()

    def test_explicit_opt_in_still_requires_bounded_budget(self):
        config = self.policy(True)
        with patch('settings.configuration', return_value=config):
            self.assertEqual(require_cloud_execution(), config)

    def test_disabled_worker_cannot_reserve_or_launch(self):
        import modal_implicit
        with patch('settings.configuration', return_value=self.policy()), \
             patch('cloud_budget.reserve') as reserve, \
             patch.object(modal_implicit.app, 'run') as gpu_run, \
             patch.object(modal_implicit.cpu_app, 'run') as cpu_run:
            for compute in ('gpu', 'cpu'):
                with self.assertRaisesRegex(ValueError, 'disabled'):
                    modal_implicit.run_implicit_cloud({}, 'must-not-run', compute=compute)
            reserve.assert_not_called()
            gpu_run.assert_not_called()
            cpu_run.assert_not_called()


if __name__ == '__main__': unittest.main()

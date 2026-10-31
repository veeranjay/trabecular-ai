import tempfile,unittest,zipfile,json
from pathlib import Path
from engine_fingerprint import numerical_signature
from source_snapshot import create
class SourceTests(unittest.TestCase):
    def test_snapshot_is_complete_and_excludes_environment_files(self):
        with tempfile.TemporaryDirectory() as directory:
            signature=numerical_signature();path=create(directory,signature)
            with zipfile.ZipFile(path) as archive:
                names=archive.namelist();self.assertTrue(all('backend/'+name in names for name in signature['sources']))
                self.assertTrue(all('.env' not in name and '.service_key' not in name for name in names))
                self.assertEqual(json.loads(archive.read('numerical-signature.json')),signature)
    def test_changed_source_cannot_be_mislabeled_with_an_old_fingerprint(self):
        signature=numerical_signature();signature={**signature,'sources':{**signature['sources'],'worker.py':'0'*64}}
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError,'Numerical source changed'):create(directory,signature)
            self.assertFalse((Path(directory)/'numerical-source.zip').exists())
if __name__=='__main__':unittest.main()
